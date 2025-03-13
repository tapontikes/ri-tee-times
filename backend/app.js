const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const cors = require('cors');

if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config({path: path.join(__dirname, '.env')})
}

const teeTimeRouter = require('./routes/teetimes'); // New tee time routes

// Import database and scheduler
const {initializeJobs, refreshAllCoursesSevenDays} = require('./jobs/teetime');
const {initDatabase} = require('./database/init')

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

// API routes
app.use('/api/tee-times', teeTimeRouter);


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
            await (refreshAllCoursesSevenDays())();
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