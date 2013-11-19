
/*
 * Water Routes
 */
var async = require('async');
var GasInvoice = require('../data/models/gasInvoice');
var middleware = require('../middleware/invoice');

var maxGasInvoicesPerPage = 5;

module.exports = function(app) {

	app.get('/gasInvoices', function(req, res, next) {
		var page = req.query.page && parseInt(req.query.page, 10) || 0;
		async.parallel([
				function(next) {
					GasInvoice.count(next);
				},

				function(next) {
					GasInvoice.findExtended(
						{ 
							page: page,
							maxPerPage: maxGasInvoicesPerPage
						},
						next
					);
				},

				function(next) {
					GasInvoice.getLabels(next);
				}						
			],

			// final callback
			function(err, results) {
				if (err) {
					return next(err);
				}

				var count = results[0];
				var gasInvoices = results[1];
				var labels = results[2];

				var lastPage = (page + 1) * maxGasInvoicesPerPage >= count;

				res.render('readings/index', {
					title: 'Gas Invoices', 
					controllerPath: '/gasInvoices/',
					labels: labels,
					readings: gasInvoices, 
					page: page,
					lastPage: lastPage
				});				
			}
		);
	});

	app.get('/gasInvoices/new', middleware.loadLabels, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'New invoice',
			controllerPath: '/gasInvoices',
			labels: req.labels			
		});
	});

	app.get('/gasInvoices/:id', middleware.loadLabels, middleware.loadReading, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'Edit invoice',
			controllerPath: '/gasInvoices',			
			labels: req.labels,			
			reading: req.reading
		});
	});	

	app.put('/gasInvoices/:id', function(req, res, next) {
		GasInvoice.update(
			{ _id: req.params.id },
			{ $set: req.body },
			function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/gasInvoices');
			}
		);
	});

	app.del('/gasInvoices/:id', middleware.loadReading, function(req, res, next) {
		GasInvoice.deleteExtended(req.reading, function(err) {
			if(err) {
				return next(err);
			}
			res.redirect('/gasInvoices');
		});
	});	

	app.post('/gasInvoices', function(req, res, next) {
		GasInvoice.createExtended(req.body, function(err) {
			if (err) {
				return next(err);
			}

			res.redirect('/gasInvoices');
		});
	});	

};