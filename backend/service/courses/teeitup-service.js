const axios = require('axios');
const moment = require('moment');

// Constants
const TEEITUP_BASE_URL = "https://phx-api-be-east-1b.kenna.io/v2/tee-times";

/**
 * Fetches tee times from TeeItUp API
 * @param {Object} params - Query parameters for the API request
 * @param {String} alias - Alias for the API request header
 * @returns {Promise<Array>} - Formatted tee times
 */
async function getTeeItUpTeeTimes(params, alias) {
  try {
    const response = await axios.get(TEEITUP_BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'x-be-alias': alias
      },
      params: params
    });

    const formattedTimes = [];
    const data = response.data;
    
    if (!data || !data[0] || !data[0].teetimes) {
      return formattedTimes;
    }
    
    data[0].teetimes.forEach((time) => {
      // Skip times that don't have riding rates
      if (!time.rates.find(rate => rate.hasOwnProperty("dueOnlineRiding"))) {
        return;
      }
      
      formattedTimes.push({
        "time": moment(time.teetime).format('h:mm A'),
        "holes": [18, 9].filter(holes => time.rates.find(rate => rate.holes === holes)),
        "spots": 4 - time.bookedPlayers
      });
    });
    
    return formattedTimes;
  } catch (error) {
    console.error("Error fetching TeeItUp tee times:", error.message);
    return [];
  }
}

module.exports = {
  getTeeItUpTeeTimes
};
