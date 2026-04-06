const {Pool} = require('pg');

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

module.exports = pool;
