var GasReading = require('../data/models/gasReading');
var common = require('./common');

module.exports.loadReading = common.loadReading(GasReading);
module.exports.loadLabels = common.loadLabels(GasReading);