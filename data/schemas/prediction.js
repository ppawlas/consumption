var async = require('async');
var Schema = require('mongoose').Schema;
var datetime = require('../../helpers/datetime');

var PredictionSchema = new Schema({
	dateFrom: {
		type: Date,
		required: true,
		default: new Date(2014, 0, 1)
	}
});

PredictionSchema.statics.createDefault = function(callback) {
	var model = this;

	model.create({ }, function(err, prediction) {
		if (err) {
			return callback(err);
		}
		return callback(null, prediction);
	});
};	

PredictionSchema.statics.findExtended = function(callback) {
	var createPrediction = function(prediction, charges, results) {
		var combined = {};
		combined._id = prediction._id;
		combined.dateFrom = prediction.dateFrom;

		var C = charges.C;
		var SSvn = charges.SSvn;
		var SZVnk = charges.SZVnk;
		var Sop = charges.Sop;
		var SoSJ = charges.SoSJ;
		var Os = charges.Os;

		var yearUsage = results ? results.average * 365 : null;
		var yearCost = results ? C * yearUsage + SSvn * 12 + SoSJ * yearUsage + SZVnk * yearUsage + Sop * 12 : null;
		var monthCost = results ? yearCost / 6 + Os : null;

		combined.yearUsage = yearUsage;
		combined.yearCost = yearCost;
		combined.monthCost = monthCost;
		return combined;
	};

	var ElectricityCharge = require('../models/electricityCharge');
	var model = this;

	model.count({ }, function(err, cnt) {
		if (cnt === 0) {
			model.createDefault(function(err, prediction) {
				if (err) {
					return callback(err);
				} else {
					return callback(null, prediction);
				}
			});			
		} else {
			model.findOne({ }, function(err, prediction) {
				if (err) {
					return callback(err);
				} else {
					model.getStatistics(prediction.dateFrom, function(err, results) {
						if (err) {
							return callback(err);
						} else {
							ElectricityCharge.findNewest(function(err, charges) {
								if (err) {
									return callback(err);
								} else {
									var combined = createPrediction(prediction, charges[0], results[0]);
									return callback(null, combined);
								}
							});
						}
					});
				}
			});	
		}
	});
};

PredictionSchema.statics.getStatistics = function(dateFrom, callback) {
	var ElectricityReading = require('../models/electricityReading');
	ElectricityReading.aggregate()
		.match({
			date : { $gte: dateFrom }
		})
		.group({
			_id : 'daily',
			average : { $avg : '$virtuals.daily'},
		})
		.sort({ _id : -1 })

		.exec(function(err, results) {
			if (err) {
				return callback(err);
			}
			callback(null, results);
	});
};

module.exports = PredictionSchema;