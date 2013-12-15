module.exports.setUsage = function(req, res, next) {
	if (typeof req.body.fixed === 'undefined') {
		req.body.fixed = false;
	} else {
		req.body.fixed = true;
	}
	next();
};

module.exports.loadReading = function(model) {
	return function(req, res, next) {
		model.findOne({ _id: req.params.id }, function(err, reading) {
			if (err) {
				return next(err);
			}
			if (! reading) {
				return res.send('Not found', 404);
			}
			req.reading = reading;
			next();		
		});
	};
};