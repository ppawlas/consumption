var mongoose = require('mongoose');
var PredictionSchema = require('../schemas/prediction');

var Prediction = mongoose.model('Prediction', PredictionSchema);

module.exports = Prediction;