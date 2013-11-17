
/*
 * Water Routes
 */
var async = require('async');
var WaterReading = require('../data/models/waterReading');
var loadWaterReading = require('../middleware/load_water_reading');

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
				}
			],

			// final callback
			function(err, results) {
				if (err) {
					return next(err);
				}

				var count = results[0];
				var waterReadings = results[1];

				var lastPage = (page + 1) * maxWaterReadingsPerPage >= count;

				res.render('readings/index', {
					title: 'Water Consumption', 
					controllerPath: '/waterReadings/',
					readings: waterReadings, 
					page: page,
					lastPage: lastPage
				});				
			}
		);
	});

	app.get('/waterReadings/new', function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'New reading',
			controllerPath: '/waterReadings'
		});
	});

	app.get('/waterReadings/:id', loadWaterReading, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'Edit reading', 
			reading: req.reading,
			controllerPath: '/waterReadings'
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

	app.del('/waterReadings/:id', loadWaterReading, function(req, res, next) {
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