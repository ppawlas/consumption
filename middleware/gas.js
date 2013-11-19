var GasReading = require('../data/models/gasReading');

function loadGasReading(req, res, next) {
	GasReading.findOne({ _id: req.params.id }, function(err, gasReading) {
		if (err) {
			return next(err);
		}
		if (! gasReading) {
			return res.send('Not found', 404);
		}
		req.reading = gasReading;
		next();		
	});
}

function loadGasLabels(req, res, next) {
	GasReading.getLabels(function(err, labels) {
		if (err) {
			return next(err);
		}
		req.labels = labels;
		next();
	});
}

module.exports.loadReading = loadGasReading;
module.exports.loadLabels = loadGasLabels;