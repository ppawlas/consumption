
/*
 * Water Routes
 */
var async = require('async');
var WaterReading = require('../data/models/waterReading');
var middleware = require('../middleware/water');

var maxWaterReadingsPerPage = 5;

module.exports = function(app) {

	app.get('/waterReadings', function(req, res, next) {
		var page = req.query.page && parseInt(req.query.page, 10) || 0;
		async.parallel([
				function(next) {
					WaterReading.count(next);
				},

				function(next) {
					WaterReading.findExtended(
						{ 
							page: page,
							maxPerPage: maxWaterReadingsPerPage
						},
						next
					);
				},

				function(next) {
					WaterReading.getLabels(next);
				}						
			],

			// final callback
			function(err, results) {
				if (err) {
					return next(err);
				}

				var count = results[0];
				var waterReadings = results[1];
				var labels = results[2];

				var lastPage = (page + 1) * maxWaterReadingsPerPage >= count;

				res.render('readings/index', {
					title: 'Water Consumption', 
					controllerPath: '/waterReadings/',
					labels: labels,
					readings: waterReadings, 
					page: page,
					lastPage: lastPage
				});				
			}
		);
	});

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