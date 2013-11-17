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

module.exports = loadWaterReading;