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
    require("dotenv").config({path: path.join(__dirname, '.env')})
}

const teeTimeRouter = require('./routes/teetimes/controller'); // New tee time routes
const teesnapRouter = require('./routes/teesnap/controller');
const foreupRouter = require('./routes/foreup/controller');

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
    secret: 'session-tom',
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
            req.session.cookieJar = jar;
        };
        next();
    } catch (error) {
        console.error('Error setting up cookie jar:', error);
        res.status(500).json({success: false, error: {message: error.message, status: 500}});
    }
});


// API routes
app.use('/api/tee-times', teeTimeRouter);
app.use('/api/teesnap', teesnapRouter);
app.use('/api/foreup', foreupRouter);

// Initialize database and jobs on app startup
(async () => {
    try {
        if (process.env.DB_CREATE_SCHEMA === 'true') {
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
            await (refreshAllTeeTimesJob(0, 6))();
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