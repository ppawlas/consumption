
/*
 * Water Routes
 */
var async = require('async');
var WaterReading = require('../data/models/waterReading');
var middleware = require('../middleware/water');
var routesHelper = require('../helpers/routes_helper');

var maxWaterReadingsPerPage = 5;

module.exports = function(app) {

	routesHelper.getData(app, WaterReading, '/waterReadings', 'Water Consumption');

	app.get('/waterReadings/new', middleware.loadLabels, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'New reading',
			controllerPath: '/waterReadings',
			labels: req.labels			
		});
	});

	app.get('/waterReadings/:id', middleware.loadLabels, middleware.loadReading, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'Edit reading',
			controllerPath: '/waterReadings',			
			labels: req.labels,			
			reading: req.reading
		});
	});	

	app.put('/waterReadings/:id', function(req, res, next) {
		WaterReading.update(
			{ _id: req.params.id },
			{ $set: req.body },
			function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/waterReadings');
			}
		);
	});

	app.del('/waterReadings/:id', middleware.loadReading, function(req, res, next) {
		WaterReading.deleteExtended(req.reading, function(err) {
			if(err) {
				return next(err);
			}
			res.redirect('/waterReadings');
		});
	});	

	app.post('/waterReadings', function(req, res, next) {
		WaterReading.createExtended(req.body, function(err) {
			if (err) {
				return next(err);
			}

			res.redirect('/waterReadings');
		});
	});	

};