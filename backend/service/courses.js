const foreUpService = require('./courses/foreup-service');
const teeItUpService = require('./courses/teeitup-service');
const teeSnapService = require('./courses/teesnap-service');
const teeWireService = require('./courses/teewire-service');

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