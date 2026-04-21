const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const cors = require('cors');
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

const teeTimeRouter = require('./routes/teetimes/controller'); // New tee time routes
const teesnapRouter = require('./routes/teesnap/controller');
const foreupRouter = require('./routes/foreup/controller');

// Import database and scheduler
const {initializeJobs, refreshAllTeeTimesJob} = require('./jobs/teetime');

const app = express();

app.use(cors());
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

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    logger.error('SESSION_SECRET environment variable is not set. Using a temporary insecure default — set this in .env for production.');
}

app.use(session({
    secret: SESSION_SECRET || 'fallback-insecure-secret-set-SESSION_SECRET-in-env',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

app.use((req, res, next) => {
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
            req.session.cookieJar = jar.serializeSync();
        };
        next();
    } catch (error) {
        next(error);
    }
});


// API routes
app.use('/api/tee-times', teeTimeRouter);
app.use('/api/teesnap', teesnapRouter);
app.use('/api/foreup', foreupRouter);

// Initialize jobs on app startup
(async () => {
    try {
        if (process.env.SCHEDULER_ENABLED === 'true') {
            await initializeJobs();
            logger.info('Tee time jobs initialized successfully');
        } else {
            logger.info('Skipping tee time jobs initialization.');
        }
        if (process.env.REFRESH_ON_STARTUP === 'true') {
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