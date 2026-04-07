const foreUpService = require('./foreup/teetimes/service');
const teeItUpService = require('./teeitup/teetimes/service');
const teeSnapService = require('./teesnap/teetimes/service');
const teeWireService = require('./teewire/teetimes/service');

module.exports = {
    // ForeUp API
    getForeUpTeeTimes: foreUpService.getForeUpTeeTimes,

    // TeeItUp API
    getTeeItUpTeeTimes: teeItUpService.getTeeItUpTeeTimes,

    // TeeSnap API
    getTeeSnapTeeTimes: teeSnapService.getTeeSnapTeeTimes,

    // TeeWire API
    getTeeWireTeeTime: teeWireService.getTeeWireTeeTime
};