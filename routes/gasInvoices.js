
/*
 * Water Routes
 */
var async = require('async');
var GasInvoice = require('../data/models/gasInvoice');
var middleware = require('../middleware/invoice');
var routesHelper = require('../helpers/routes_helper');

var maxGasInvoicesPerPage = 500;

module.exports = function(app) {

	routesHelper.getData(app, GasInvoice, '/gasInvoices', 'Gas Invoices');

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

	routesHelper.importData(app, GasInvoice, '/gasInvoices');

};