var mongoose = require('mongoose');
var electricityChargeSchema = require('../schemas/electricityCharge');

var electricityCharge = mongoose.model('electricityCharge', electricityChargeSchema);

module.exports = electricityCharge;