var mongoose = require('mongoose');
var GasReadingSchema = require('../schemas/gasReading');

var GasReading = mongoose.model('GasReading', GasReadingSchema);

module.exports = GasReading;