const axios = require('axios');
const logger = require('../../../utils/logger');
const {getRandomUserAgent} = require('../../../utils/user-agents');

const TEEWIRE_BASE_URL = 'https://www.teewire.app';

async function getTeeWireTeeTime(date, params) {
    try {
        const url = `${TEEWIRE_BASE_URL}/${params.slug}/online/application/web/api/golf-api.php`;
        const response = await axios.get(url, {
            params: {action: 'tee-times', date},
            headers: {'User-Agent': getRandomUserAgent()},
            timeout: 5000,
        });

        const teeTimes = response.data?.data?.tee_times;
        if (!teeTimes?.length) return [];

        return teeTimes
            .filter(slot => slot.availability.available_spots > 0)
            .map(slot => ({
                time: new Date(slot.timestamp * 1000).toISOString(),
                spots: slot.availability.available_spots,
                holes: [...new Set(slot.pricing.rates
                    .filter(r => slot.turn_time_available || r.holes !== 18)
                    .map(r => r.holes))].sort((a, b) => a - b),
            }));
    } catch (error) {
        if (error.response) {
            logger.error(`TeeWire API error for ${params.slug}: HTTP ${error.response.status}`, error.response.data ?? '');
        } else {
            logger.error(`TeeWire fetch error for ${params.slug}:`, error);
        }
        return [];
    }
}

module.exports = {
    getTeeWireTeeTime
};
