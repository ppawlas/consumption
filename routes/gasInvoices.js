
/*
 * Gas Invoices Routes
 */
var async = require('async');
var GasInvoice = require('../data/models/gasInvoice');
var middleware = require('../middleware/invoice');
var routesHelper = require('../helpers/routes_helper');

module.exports = function(app) {

	function getCosts(callback) {
		var costs = {};
		return callback(null, costs);
	}

	routesHelper.setRoutes(app, GasInvoice, middleware, '/gasInvoices',
		{'index': 'Gas Invoices', 'new': 'New invoice', 'edit': 'Edit invoice'});

	/*
	 * Heating Costs routes
	 */
	app.get('/heatingCosts', function(req, res, next) {
		GasInvoice.findCosts(function(err, costs) {
			if (err) {
				return next(err);
			}
			res.render('helpers/costs', {
				title: res.__('Heating Costs'),
				heatingCosts: costs				
			});			
		});
	});

	app.get('/heatingCosts/json', function(req, res, next) {
		console.log('json request');
		getCosts(function(err, costs) {
			if (err) {
				return next(err);
			}
			res.set('Access-Control-Allow-Origin', '*');
			res.set('Access-Control-Allow-Headers', 'X-Requested-With');			
			res.send(costs);
		});
	});	

};