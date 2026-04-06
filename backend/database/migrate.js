const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const pool = require('./config');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
    const client = await pool.connect();
    try {
        // Tracking table — created once, never migrated away
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename   VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        const { rows: applied } = await client.query(
            'SELECT filename FROM schema_migrations ORDER BY filename'
        );
        const appliedSet = new Set(applied.map(r => r.filename));

        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            if (appliedSet.has(file)) {
                logger.info(`Migration already applied: ${file}`);
                continue;
            }

            logger.info(`Applying migration: ${file}`);
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                logger.info(`Migration applied: ${file}`);
            } catch (err) {
                await client.query('ROLLBACK');
                throw new Error(`Migration failed [${file}]: ${err.message}`);
            }
        }

        logger.info('All migrations up to date.');
    } finally {
        client.release();
    }
}

module.exports = { migrate };

if (require.main === module) {
    migrate()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err.message);
            process.exit(1);
        });
}
