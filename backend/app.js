const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const cors = require('cors');
const axios = require('axios');
const {CookieJar} = require("tough-cookie");
const { wrapper } = require('axios-cookiejar-support');


if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config({path: path.join(__dirname, '.env')})
}

const teeTimeRouter = require('./routes/teetimes/controller'); // New tee time routes
const teesnapRoutes = require('./routes/teesnap/controller');

// Import database and scheduler
const {initializeJobs, refreshAllTeeTimesJob} = require('./jobs/teetime');
const {initDatabase} = require('./database/init')

const app = express();

app.use(cors());
app.use(express.json());
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

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use((req, res, next) => {
    try {
        if (!req.session.cookieClientCreated) {
            const cookieJar = new CookieJar();
            req.session.cookieJar = cookieJar.serializeSync();
            req.session.cookieClientCreated = true;
        }

        const cookieJar = CookieJar.deserializeSync(req.session.cookieJar);
        req.cookieClient = wrapper(axios.create({ jar: cookieJar }));
        req.saveCookieJar = () => {
            req.session.cookieJar = req.cookieClient.defaults.jar.serializeSync();
        };

        next();
    } catch (error) {
        console.error('Error setting up cookie jar:', error);
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                status: 500
            }
        });
    }
});

// API routes
app.use('/api/tee-times', teeTimeRouter);
app.use('/api/teesnap', teesnapRoutes);



// Initialize database and jobs on app startup
(async () => {
    try {
        if (process.env.DB_SEED === 'true') {
            await initDatabase();
            logger.info('Database initialized successfully')
        } else {
            logger.info('Skipping database initialization.');
        }
        if (process.env.SCHEDULER_ENABLED === 'true') {
            await initializeJobs();
            logger.info('Tee time jobs initialized successfully');
        } else {
            logger.info('Skipping tee time jobs initialization.');
        }
        if (process.env.REFRESH_ON_STARTUP === 'true') {
            logger.info('Running refresh on startup.');
            await (refreshAllTeeTimesJob())();
        }

    } catch (error) {
        logger.error('Error during initialization:', error);
    }
    logger.info('App started successfully.');
})();


// catch 404 and forward to error handler
app.use((req, res) => {
    res.status(404).send("Not Found");
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({
        error: {
            message: err.message,
            status: err.status || 500
        }
    });
});


module.exports = app;