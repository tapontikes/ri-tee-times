const fs = require('fs');
const path = require('path');
const client = require('./config');
const logger = require('../utils/logger');
const config = require('../config');


async function initDatabase() {
    try {
        logger.info('Initializing database...');

        // Read the schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute the schema
        await client.query(schema);
        logger.info('Database schema created successfully.');


        // Insert initial courses from config update if entry exists
        for (const course of config.courses) {
            await client.query(
                `INSERT INTO golf_courses (id, name, provider, booking_url, request_data, address)
                 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO
                UPDATE
                    SET name = EXCLUDED.name,
                    provider = EXCLUDED.provider,
                    booking_url = EXCLUDED.booking_url,
                    request_data = EXCLUDED.request_data,
                    address = EXCLUDED.address,
                    updated_at = NOW()`,
                [
                    course.id,
                    course.name,
                    course.type,
                    course.bookingUrl,
                    JSON.stringify(course.requestData),
                    course.address
                ]
            );
            logger.info(`Ensured course exists: ${course.name}`);
        }

        logger.info('Database initialization completed successfully.');
    } catch (error) {
        logger.error('Error initializing database:', error);
        throw error;
    }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
    initDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            logger.error('Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = {initDatabase};
