var WaterReading = require('../data/models/waterReading');

function loadWaterReading(req, res, next) {
	WaterReading.findOne({ _id: req.params.id }, function(err, waterReading) {
		if (err) {
			return next(err);
		}
		if (! waterReading) {
			return res.send('Not found', 404);
		}
		req.reading = waterReading;
		next();		
	});
}

function loadWaterLabels(req, res, next) {
	WaterReading.getLabels(function(err, labels) {
		if (err) {
			return next(err);
		}
		req.labels = labels;
		next();
	});
}

module.exports.loadReading = loadWaterReading;
module.exports.loadLabels = loadWaterLabels;