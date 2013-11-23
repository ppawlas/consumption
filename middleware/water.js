var WaterReading = require('../data/models/waterReading');
var common = require('./common');

module.exports.loadReading = common.loadReading(WaterReading);
module.exports.loadLabels = common.loadLabels(WaterReading);