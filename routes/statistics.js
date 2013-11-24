
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

	app.get('/statistics', function(req, res, next) {
		async.parallel([
				function(next) {
					GasReading.getStatistics(next);	
				},
				function(next) {
					ElectricityReading.getStatistics(next);	
				},
				function(next) {
					WaterReading.getStatistics(next);	
				}
			],
			function(err, results) {
				if (err) {
					return next(err);
				}
				var gas = results[0];
				var electricity = results[1];
				var water = results[2];

				var merged = mergeStatistics(gas, electricity, water);

				res.render('statistics/index', {
					title: 'Statistics',
					periods: merged.periods,
					data: merged.data
				});
			}
		);
	});

};