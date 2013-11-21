
/*
 * Electricity Routes
 */
var fs = require('fs'); 
var path = require('path');
var async = require('async');
var ElectricityReading = require('../data/models/electricityReading');
var ElectricityCharge = require('../data/models/electricityCharge');
var middleware = require('../middleware/electricity');

var maxElectricityReadingsPerPage = 500;

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
					lastPage: lastPage,
					links: [
						{ href: '/electricityCharges', name: 'Electricity Charges' },
						{ href: '/electricityReadings/import/load', name: 'Import Data' }
					]
				});				
			}
		);
	});

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

	app.get('/electricityReadings/import/load', function(req, res, next) {
		console.log(__dirname);
		var file = path.normalize(__dirname  + '/../data/raw/electricity.json');
		fs.readFile(file, 'utf8', function(err, data) {
			if (err) {
				return next(err);
			}

			ElectricityReading.importData(JSON.parse(data), function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/electricityReadings');				
			});
		})
	});

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