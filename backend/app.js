const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const teeTimeRouter = require('./routes/teetimes'); // New tee time routes

// Import database and scheduler
const {initializeJobs} = require('./jobs/teetime');
const {initDatabase} = require('./database/init')
const {refreshAllCoursesSevenDays} = require('./jobs/teetime');
const customLogger = require('./utils/logger');

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/health', require('express-healthcheck')());

// API routes
app.use('/', indexRouter);
app.use('/api/tee-times', teeTimeRouter);

// Initialize database and jobs on app startup
(async () => {
    try {
        if (process.env.DB_SEED) {
            await initDatabase();
            customLogger.info('Database initialized successfully')
        } else {
            customLogger.info('Skipping database initialization.');
        }
        if (process.env.SCHEDULER_ENABLED) {
            await initializeJobs();
            customLogger.info('Tee time jobs initialized successfully');
        } else {
            customLogger.info('Skipping tee time jobs initialization.');
        }
    } catch (error) {
        customLogger.error('Error during initialization:', error);
    }
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