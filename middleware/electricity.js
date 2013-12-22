var ElectricityReading = require('../data/models/electricityReading');
var ElectricityCharge = require('../data/models/electricityCharge');
var common = require('./common');

module.exports.loadReading = common.loadReading(ElectricityReading);
module.exports.loadCharge = common.loadReading(ElectricityCharge);

module.exports.loadLabels = function(req, res, next) {
	ElectricityCharge.getLabels(function(err, labels) {
		if (err) {
			return next(err);
		}
		if (! labels) {
			return res.send('Labels not found', 404);
		}
		req.labels = labels;
		next();		
	});
};