
/*
 * Water Routes
 */
var WaterReading = require('../data/models/waterReading');
var middleware = require('../middleware/water');
var routesHelper = require('../helpers/routes_helper');

module.exports = function(app) {

	routesHelper.setRoutes(app, WaterReading, middleware, '/waterReadings', {'index': 'Water Consumption'});

};