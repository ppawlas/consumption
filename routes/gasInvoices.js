
/*
 * Gas Invoices Routes
 */
var async = require('async');
var GasInvoice = require('../data/models/gasInvoice');
var middleware = require('../middleware/invoice');
var routesHelper = require('../helpers/routes_helper');

module.exports = function(app) {

	function getCosts(callback) {
		GasInvoice.findCosts(function(err, costsData) {
			if (err) {
				return callback(err);
			}
			var data = [];
			costsData.forEach(function(costDatum) {
				var datum = {
					'_id': costDatum._id,
					'Koszt': costDatum.cost,
					'Zużycie': costDatum.usage
				};
				datum.invoices = [
					{'name': 'Koszt', 'value': costDatum.cost},
					{'name': 'Zużycie', 'value': costDatum.usage}
				];
				data.push(datum);
			});
			return callback(null, data);
		});
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