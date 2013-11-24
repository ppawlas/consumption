
/*
 * Electricity Routes
 */
var async = require('async');
var ElectricityReading = require('../data/models/electricityReading');
var ElectricityCharge = require('../data/models/electricityCharge');
var middleware = require('../middleware/electricity');
var routesHelper = require('../helpers/routes_helper');

module.exports = function(app) {

	routesHelper.setRoutes(app, ElectricityReading, middleware, '/electricityReadings', {'index': 'Electricity Consumption'},
		[{ href: '/electricityCharges', name: 'Electricity Charges' }]);

	/*
	 * Electricity Charges routes
	 */
	app.get('/electricityCharges', function(req, res, next) {
		async.parallel([
				function(next) {
					ElectricityCharge.findExtended(next);
				},
				function(next) {
					ElectricityCharge.getLabels(next);
				}				
			], 
			function(err, results) {
				if (err) {
					return next(err);
				}
				var electricityCharge = results[0];
				var labels = results[1];	

				res.render('helpers/charges', {
					title: 'Electricity Charges',
					electricityCharge: electricityCharge,					
					labels: labels
				});
			});
	});

	routesHelper.putReading(app, ElectricityCharge, '/electricityCharges', '/electricityReadings');

};