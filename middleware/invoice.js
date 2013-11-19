var GasInvoice = require('../data/models/gasInvoice');

function loadGasInvoice(req, res, next) {
	GasInvoice.findOne({ _id: req.params.id }, function(err, gasInvoice) {
		if (err) {
			return next(err);
		}
		if (! gasInvoice) {
			return res.send('Not found', 404);
		}
		req.reading = gasInvoice;
		next();		
	});
}

function loadInvoiceLabels(req, res, next) {
	GasInvoice.getLabels(function(err, labels) {
		if (err) {
			return next(err);
		}
		req.labels = labels;
		next();
	});
}

module.exports.loadReading = loadGasInvoice;
module.exports.loadLabels = loadInvoiceLabels;