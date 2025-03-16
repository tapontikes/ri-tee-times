const foreUpService = require('./courses/foreup/teetimes/service');
const teeItUpService = require('./courses/teeitup/teetimes/service');
const teeSnapService = require('./courses/teesnap/teetimes/service');
const teeWireService = require('./courses/teewire/teetimes/service');

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