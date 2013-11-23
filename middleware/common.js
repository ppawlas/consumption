module.exports.loadReading = function(model) {
	return function(req, res, next) {
		model.findOne({ _id: req.params.id }, function(err, gasInvoice) {
			if (err) {
				return next(err);
			}
			if (! gasInvoice) {
				return res.send('Not found', 404);
			}
			req.reading = gasInvoice;
			next();		
		});
	};
};

module.exports.loadLabels = function(model) {
	return function(req, res, next) {	
		model.getLabels(function(err, labels) {
			if (err) {
				return next(err);
			}
			req.labels = labels;
			next();
		});
	};
};