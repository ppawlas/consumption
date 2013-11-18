var mongoose = require('mongoose');
var ElectricityReadingSchema = require('../schemas/electricityReading');

var ElectricityReading = mongoose.model('ElectricityReading', ElectricityReadingSchema);

module.exports = ElectricityReading;