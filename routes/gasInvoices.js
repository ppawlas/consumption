
/*
 * Water Routes
 */
var GasInvoice = require('../data/models/gasInvoice');
var middleware = require('../middleware/invoice');
var routesHelper = require('../helpers/routes_helper');

var maxGasInvoicesPerPage = 500;

module.exports = function(app) {

	routesHelper.setRoutes(app, GasInvoice, middleware, '/gasInvoices',
		{'index': 'Gas Invoices', 'new': 'New invoice', 'edit': 'Edit invoice'});
	routesHelper.importData(app, GasInvoice, '/gasInvoices');

};