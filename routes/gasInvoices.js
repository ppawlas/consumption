
/*
 * Gas Invoices Routes
 */
var async = require('async');
var GasInvoice = require('../data/models/gasInvoice');
var middleware = require('../middleware/invoice');
var routesHelper = require('../helpers/routes_helper');

var maxGasInvoicesPerPage = 500;

module.exports = function(app) {

	routesHelper.setRoutes(app, GasInvoice, middleware, '/gasInvoices',
		{'index': 'Gas Invoices', 'new': 'New invoice', 'edit': 'Edit invoice'},
		[{ href: '/heatingCosts', name: 'Heating Costs' }]);

	/*
	 * Heating Costs routes
	 */
	app.get('/heatingCosts', function(req, res, next) {
		async.parallel([
				function(next) {
					GasInvoice.findCosts(next);
				},
				function(next) {
					GasInvoice.getCostsLabels(next);
				}				
			], 
			function(err, results) {
				if (err) {
					return next(err);
				}
				var heatingCosts = results[0];
				var labels = results[1];	

				res.render('helpers/costs', {
					title: 'Heating Costs',
					heatingCosts: heatingCosts,					
					labels: labels
				});
			});
	});

};