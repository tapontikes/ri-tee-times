const {Pool} = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

// Prevent unhandled 'error' events from crashing the process
pool.on('error', (err) => {
    logger.error('Unexpected database pool error:', err.message);
});

module.exports = pool;
