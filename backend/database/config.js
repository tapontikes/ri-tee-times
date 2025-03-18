const {Pool} = require('pg');
const config = require('../config');

const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    ssl: config.database.ssl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

module.exports = pool;
module.exports = pool;
