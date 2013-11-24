
/*
 * Gas Invoices Routes
 */
var async = require('async');
var GasInvoice = require('../data/models/gasInvoice');
var middleware = require('../middleware/invoice');
var routesHelper = require('../helpers/routes_helper');

module.exports = function(app) {

	routesHelper.setRoutes(app, GasInvoice, middleware, '/gasInvoices',
		{'index': 'Gas Invoices', 'new': 'New invoice', 'edit': 'Edit invoice'},
		[{ href: '/heatingCosts', name: 'Heating Costs' }]);

	/*
	 * Heating Costs routes
	 */
	app.get('/heatingCosts', function(req, res, next) {
		GasInvoice.findCosts(function(err, costs) {
			if (err) {
				return next(err);
			}
			res.render('helpers/costs', {
				title: 'Heating Costs',
				heatingCosts: costs				
			});			
		});
	});

};