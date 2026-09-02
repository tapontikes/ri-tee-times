const winston = require('winston');

const formatExtra = (info) => {
    const splat = info[Symbol.for('splat')];
    if (!splat?.length) return '';
    return ' ' + splat.map(s => {
        if (s instanceof Error) return s.stack ?? s.message;
        if (typeof s === 'object') return JSON.stringify(s);
        return String(s);
    }).join(' ');
};

const logFormat = winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}${formatExtra(info)}`)
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        })
    ]
});

module.exports = logger;
