const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const cors = require('cors');
const helmet = require('helmet');
const {rateLimit} = require('express-rate-limit');
const MemoryStore = require('memorystore')(session);
const axios = require('axios');
const {CookieJar} = require("tough-cookie");
const {wrapper} = require('axios-cookiejar-support');
const {v4: uuidv4} = require('uuid');


if (process.env.NODE_ENV !== 'production') {
    // Try backend/.env first, fall back to project root .env
    const localEnv = path.join(__dirname, '.env');
    const rootEnv = path.join(__dirname, '..', '.env');
    const fs = require('fs');
    require("dotenv").config({path: fs.existsSync(localEnv) ? localEnv : rootEnv});
}

const teeTimeRouter = require('./routes/teetimes/controller');
const teesnapRouter = require('./routes/teesnap/controller');
const foreupRouter = require('./routes/foreup/controller');
const proxyRouter = require('./routes/proxy/controller');

// Import database and scheduler
const {initializeJobs, refreshAllTeeTimesJob} = require('./jobs/teetime');
const {client: ldClient} = require('./utils/launchdarkly');

const app = express();

app.disable('x-powered-by');
// Exactly one reverse proxy (nginx) sits in front: trust the client address it appends to
// X-Forwarded-For so rate limiting and secure cookies see the real client, not the proxy.
app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: false,      // needs a policy tailored to Angular + 3rd-party SDKs; enable separately
    frameguard: false,                 // the booking UI is intentionally embeddable (iframe booking)
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    hsts: false                        // HSTS is set by nginx
}));

// CORS: only our own origins (plus CORS_ORIGINS, comma separated). Same-origin and non-browser
// requests carry no Origin header and are always allowed.
const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : ['https://golf-ri.com', 'https://www.golf-ri.com', 'http://localhost:4200', 'http://localhost:3000'];
app.use(cors({origin: (origin, cb) => cb(null, !origin || corsOrigins.includes(origin))}));

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan(':method :url :status - :response-time ms', {
    stream: {
        write: (message) => {
            logger.info(message.trim()); // Log to Winston
        }
    }
}));

// Per-client rate limit for the whole API (clients are identified via trust proxy above).
app.use('/api', rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {error: {message: 'Too many requests, slow down.', status: 429}}
}));

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    logger.error('SESSION_SECRET is not set. Refusing to start without a session secret (set it in .env / the environment).');
    process.exit(1);
}

// Sessions only hold the visitor's booking-site login (ForeUp / Teesnap), so they are created
// lazily and only on those routes. The store is bounded (LRU, max entries + TTL) so unauthenticated
// clients cannot grow memory without limit.
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({checkPeriod: 60 * 60 * 1000, max: 2000, ttl: SESSION_TTL_MS}),
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: 'auto',     // Secure when the request arrived over https (via trust proxy)
        maxAge: SESSION_TTL_MS
    }
});

const attachSession = (req, res, next) => {
    try {
        if (!req.session.userId) {
            req.session.userId = uuidv4();
            req.session.createdAt = new Date();
        }

        // Initialize or restore cookie jar
        if (req.session.cookieJar) {
            req.session.cookieJar = CookieJar.deserializeSync(req.session.cookieJar);
        } else {
            req.session.cookieJar = new CookieJar();
        }

        // Create axios client with the restored cookie jar
        req.axiosClient = wrapper(axios.create({jar: req.session.cookieJar}));

        req.saveCookieJar = (jar) => {
            req.session.cookieJar = jar;
        };
        next();
    } catch (error) {
        next(error);
    }
};


// API routes. Only the booking-site routers need a session / cookie jar.
app.use('/api/tee-times', teeTimeRouter);
app.use('/api/teesnap', sessionMiddleware, attachSession, teesnapRouter);
app.use('/api/foreup', sessionMiddleware, attachSession, foreupRouter);
app.use('/api/proxy', proxyRouter);

// Initialize jobs on app startup
(async () => {
    try {
        await ldClient.waitForInitialization({timeout: 5});
        logger.info('LaunchDarkly initialized.');
    } catch (err) {
        logger.warn('LaunchDarkly initialization failed or timed out — continuing without it.', err.message);
    }

    try {
        const serverCtx = {kind: 'user', key: 'server'};

        await initializeJobs();
        logger.info('Tee time jobs initialized successfully');

        const refreshOnStartup = await ldClient.boolVariation('refresh-on-startup', serverCtx, false);
        if (refreshOnStartup) {
            logger.info('Running refresh on startup.');
            await (refreshAllTeeTimesJob(0, 6))();
        }
    } catch (error) {
        logger.error('Error during initialization:', error);
    }
    logger.info('App started successfully.');
})();


// SPA fallback — serve index.html for all non-API routes so Angular can handle routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// catch 404 and forward to error handler
app.use((req, res) => {
    res.status(404).json({error: {message: 'Not Found', status: 404}});
});

// Detect database connection errors from pg
function isDbConnectionError(err) {
    return err.code === 'ECONNREFUSED' ||
        err.code === 'ENOTFOUND' ||
        err.code === '57P03' || // pg: cannot connect now
        err.code === '3D000' || // pg: database does not exist
        err.code === '28P01' || // pg: invalid password
        (err.message && err.message.includes('connect ECONNREFUSED'));
}

// error handler
app.use((err, req, res, next) => {
    const isDev = req.app.get('env') === 'development';

    if (isDbConnectionError(err)) {
        logger.error(`DB connection error on ${req.method} ${req.path}:`, err.message);
        return res.status(503).json({
            error: {
                message: 'Database unavailable. Please try again shortly.',
                status: 503
            }
        });
    }

    const status = err.status || 500;
    logger.error(`${status} on ${req.method} ${req.path}:`, err.message);

    res.status(status).json({
        error: {
            message: isDev ? err.message : 'An unexpected error occurred.',
            status
        }
    });
});


module.exports = app;