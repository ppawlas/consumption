
/*
 * Gas Routes
 */
var async = require('async');
var GasReading = require('../data/models/gasReading');
var loadGasReading = require('../middleware/load_gas_reading');

var maxGasReadingsPerPage = 5;

module.exports = function(app) {

	app.get('/gasReadings', function(req, res, next) {
		var page = req.query.page && parseInt(req.query.page, 10) || 0;
		async.parallel([
				function(next) {
					GasReading.count(next);
				},

				function(next) {
					GasReading.findExtended(
						{ 
							page: page,
							maxPerPage: maxGasReadingsPerPage
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
				var gasReadings = results[1];

				var lastPage = (page + 1) * maxGasReadingsPerPage >= count;

				res.render('readings/index', {
					title: 'Gas Consumption', 
					controllerPath: '/gasReadings/',
					readings: gasReadings,				
					page: page,
					lastPage: lastPage
				});				
			}
		);
	});

	app.get('/gasReadings/new', function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'New reading',
			controllerPath: '/gasReadings'
		});
	});

	app.get('/gasReadings/:id', loadGasReading, function(req, res, next) {
		res.render('readings/new_edit', {
			title: 'Edit reading',
			controllerPath: '/gasReadings',
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

	app.del('/gasReadings/:id', loadGasReading, function(req, res, next) {
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

};