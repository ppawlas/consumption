
/*
 * Electricity Routes
 */
var async = require('async');
var ElectricityReading = require('../data/models/electricityReading');
var loadElectricityReading = require('../middleware/load_electricity_reading');

var maxElectricityReadingsPerPage = 5;

module.exports = function(app) {

	app.get('/electricityReadings', function(req, res, next) {
		var page = req.query.page && parseInt(req.query.page, 10) || 0;
		async.parallel([
				function(next) {
					ElectricityReading.count(next);
				},

				function(next) {
					ElectricityReading.findExtended(
						{ 
							page: page,
							maxPerPage: maxElectricityReadingsPerPage
						},
						next
					);
				},

				function(next) {
					ElectricityReading.getLabels(next);
				}				
			],

			// final callback
			function(err, results) {
				if (err) {
					return next(err);
				}

				var count = results[0];
				var electricityReadings = results[1];
				var labels = results[2];

				var lastPage = (page + 1) * maxElectricityReadingsPerPage >= count;

				res.render('readings/index', {
					title: 'Electricity Consumption', 
					controllerPath: '/electricityReadings/',
					labels: labels,
					readings: electricityReadings, 
					page: page,
					lastPage: lastPage
				});				
			}
		);
	});

	app.get('/electricityReadings/new', function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'New reading',
			controllerPath: '/electricityReadings'
		});
	});

	app.get('/electricityReadings/:id', loadElectricityReading, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'Edit reading', 
			reading: req.reading,
			controllerPath: '/electricityReadings'
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

	app.del('/electricityReadings/:id', loadElectricityReading, function(req, res, next) {
		ElectricityReading.deleteExtended(req.reading, function(err) {
			if(err) {
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

};