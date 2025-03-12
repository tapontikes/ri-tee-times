const axios = require('axios');
const moment = require('moment');
const cheerio = require('cheerio');

// Constants
const TEEWIRE_BASE_URL = "https://teewire.net";

/**
 * Fetches tee times from TeeWire API
 * @param {Object} params - Query parameters for the API request
 * @param {Object} data - Form data for the API request
 * @param {String} path - API endpoint path
 * @returns {Promise<Array>} - Formatted tee times
 */
async function getTeeWireTeeTime(params, data, path) {
  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: TEEWIRE_BASE_URL + path,
      params: params,
      timeout: 2500,
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-GPC': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Brave";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      data: data
    };

    const response = await axios.request(config);
    const formattedTimes = [];
    const html = response.data;
    const $ = cheerio.load(html);

    $('body > div').each((i, el) => {
      try {
        const time = $(el).find('.panel-title').first().text().trim();
        const spotsMatch = $(el).find('.panel-body').text().trim().match(/Up to (\d+) golfers/);
        
        if (!spotsMatch) {
          return;
        }
        
        const spots = spotsMatch[1];
        let holes = $(el).find('.panel-footer').text().trim();
        const holesMatch = holes.match(/(9|18)/);
        
        if (!holesMatch) {
          return;
        }
        
        holes = holesMatch[0];
        
        formattedTimes.push({
          "time": moment(time, 'h:mm A').format('h:mm A'),
          "holes": parseInt(holes, 10),
          "spots": parseInt(spots, 10)
        });
      } catch (ex) {
        // Skip elements that don't match the expected structure
        return;
      }
    });
    
    return formattedTimes;
  } catch (error) {
    console.error("Error fetching TeeWire tee times:", error.message);
    return [];
  }
}

module.exports = {
  getTeeWireTeeTime
};
