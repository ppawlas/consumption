
/*
 * Gas Routes
 */
var GasReading = require('../data/models/gasReading');
var middleware = require('../middleware/gas');
var routesHelper = require('../helpers/routes_helper');
module.exports = function(app) {

	routesHelper.setRoutes(app, GasReading, middleware, '/gasReadings', {'index': 'Gas Consumption'});

};