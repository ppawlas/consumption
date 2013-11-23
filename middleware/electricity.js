var ElectricityReading = require('../data/models/electricityReading');
var common = require('./common');

module.exports.loadReading = common.loadReading(ElectricityReading);
module.exports.loadLabels = common.loadLabels(ElectricityReading);