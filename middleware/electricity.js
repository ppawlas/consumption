var ElectricityReading = require('../data/models/electricityReading');

function loadElectricityReading(req, res, next) {
	ElectricityReading.findOne({ _id: req.params.id }, function(err, electricityReading) {
		if (err) {
			return next(err);
		}
		if (! electricityReading) {
			return res.send('Not found', 404);
		}
		req.reading = electricityReading;
		next();		
	});
}

function loadElectricityLabels(req, res, next) {
	ElectricityReading.getLabels(function(err, labels) {
		if (err) {
			return next(err);
		}
		req.labels = labels;
		next();
	});
}

module.exports.loadReading = loadElectricityReading;
module.exports.loadLabels = loadElectricityLabels;