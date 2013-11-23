
/*
 * Gas Routes
 */
var async = require('async');
var GasReading = require('../data/models/gasReading');
var middleware = require('../middleware/gas');
var routesHelper = require('../helpers/routes_helper');

var maxGasReadingsPerPage = 500;

module.exports = function(app) {

	routesHelper.getData(app, GasReading, '/gasReadings', 'Gas Consumption');

	app.get('/gasReadings/new', middleware.loadLabels, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'New reading',
			controllerPath: '/gasReadings',
			labels: req.labels			
		});
	});

	app.get('/gasReadings/:id', middleware.loadLabels, middleware.loadReading, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'Edit reading',
			controllerPath: '/gasReadings',
			labels: req.labels,
			reading: req.reading
		});
	});	

	app.put('/gasReadings/:id', function(req, res, next) {
		GasReading.update(
			{ _id: req.params.id },
			{ $set: req.body },
			function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/gasReadings');
			}
		);
	});

	app.del('/gasReadings/:id', middleware.loadReading, function(req, res, next) {
		GasReading.deleteExtended(req.reading, function(err) {
			if(err) {
				return next(err);
			}
			res.redirect('/gasReadings');
		});
	});	

	app.post('/gasReadings', function(req, res, next) {
		GasReading.createExtended(req.body, function(err) {
			if (err) {
				return next(err);
			}

			res.redirect('/gasReadings');
		});
	});	

	routesHelper.importData(app, GasReading, '/gasReadings');	

};