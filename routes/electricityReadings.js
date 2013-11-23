
/*
 * Electricity Routes
 */
var async = require('async');
var ElectricityReading = require('../data/models/electricityReading');
var ElectricityCharge = require('../data/models/electricityCharge');
var middleware = require('../middleware/electricity');
var routesHelper = require('../helpers/routes_helper');

var maxElectricityReadingsPerPage = 500;

module.exports = function(app) {

	routesHelper.getData(app, ElectricityReading, '/electricityReadings', 'Electricity Consumption',
		[{ href: '/electricityCharges', name: 'Electricity Charges' }]);

	app.get('/electricityReadings/new', middleware.loadLabels, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'New reading',
			controllerPath: '/electricityReadings',
			labels: req.labels			
		});
	});

	app.get('/electricityReadings/:id', middleware.loadLabels, middleware.loadReading, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'Edit reading',
			controllerPath: '/electricityReadings',			
			labels: req.labels,			
			reading: req.reading
		});
	});	

	app.put('/electricityReadings/:id', function(req, res, next) {
		ElectricityReading.update(
			{ _id: req.params.id },
			{ $set: req.body },
			function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/electricityReadings');
			}
		);
	});

	app.del('/electricityReadings/:id', middleware.loadReading, function(req, res, next) {
		ElectricityReading.deleteExtended(req.reading, function(err) {
			if (err) {
				return next(err);
			}
			res.redirect('/electricityReadings');
		});
	});	

	app.post('/electricityReadings', function(req, res, next) {
		ElectricityReading.createExtended(req.body, function(err) {
			if (err) {
				return next(err);
			}

			res.redirect('/electricityReadings');
		});
	});	

	routesHelper.importData(app, ElectricityReading, '/electricityReadings');

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

	app.put('/electricityCharges/:id', function(req, res, next) {
		ElectricityCharge.update(
			{ _id: req.params.id },
			{ $set: req.body },
			function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/electricityReadings');
			}
		);
	});	

};