var mongoose = require('mongoose');
var WaterReadingSchema = require('../schemas/waterReading');

var WaterReading = mongoose.model('WaterReading', WaterReadingSchema);

module.exports = WaterReading;