
/*
 * Statistics Routes
 */
var async = require('async');
var GasReading = require('../data/models/gasReading');
var ElectricityReading = require('../data/models/electricityReading');
var WaterReading = require('../data/models/waterReading');

module.exports = function(app) {

	function mergeStatistics(gas, electricity, water) {

		function gather(resultSet, name, multiplier) {
			multiplier = typeof multiplier !== 'undefined' ? multiplier : 1;

			resultSet.forEach(function(result) {
				var period = result._id.year + '-' + result._id.month;
				if (periods.indexOf(period) === -1) {
					periods.push(period);
					data[period] = {};
				}
				data[period][name] = result.average * multiplier;
			});
		}

		var periods = [];
		var data = {};

		gather(gas, 'gas');
		gather(electricity, 'electricity');
		gather(water, 'water', 7);

		return { 'periods': periods, 'data': data };
	}

	function getStatistics(limits, callback) {

		async.parallel([
				function(next) {
					GasReading.getStatistics(limits, next);	
				},
				function(next) {
					ElectricityReading.getStatistics(limits, next);	
				},
				function(next) {
					WaterReading.getStatistics(limits, next);	
				}
			],
			function(err, results) {
				if (err) {
					return callback(err);
				}
				var gas = results[0];
				var electricity = results[1];
				var water = results[2];

				var merged = mergeStatistics(gas, electricity, water);

				callback(null, merged);
			}
		);
	}

	function createLimits(query) {
		var limits = { date: { } };
		if (query.from) {
			limits.date.$gte = new Date(parseInt(query.from));
		}
		if (query.to) {
			limits.date.$lte = new Date(parseInt(query.to));
		}
		return limits;
	}

	app.get('/statistics/json', function(req, res, next) {
		limits = req.query ? createLimits(req.query) : {};

		getStatistics(limits, function(err, merged) {
			if (err) {
				return next(err);
			}
			res.set('Access-Control-Allow-Origin', '*');
			res.set('Access-Control-Allow-Headers', 'X-Requested-With');			
			res.send(merged);
		});
	});

	app.get('/statistics', function(req, res, next) {
		limits = {};

		getStatistics(limits, function(err, merged) {
			if (err) {
				return next(err);
			}
			res.render('statistics/index', {
				title: 'Statistics',
				links: [{ href: '/statistics/charts', name: 'Charts' }],
				periods: merged.periods,
				data: merged.data
			});
		});
	});

	app.get('/statistics/charts', function(req, res, next) {
			res.render('statistics/charts', {
				title: 'Charts'
			});
	});	

};