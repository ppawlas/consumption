var Schema = require('mongoose').Schema;
var ReadingSchema = require('./reading');
var extend = require('mongoose-schema-extend');
var ElectricityCharge = require('../models/electricityCharge');
var datetime = require('../../helpers/datetime');
var numeric = require('../../helpers/numeric');

var ElectricityReadingSchema = ReadingSchema.extend({
	previous: {
		type: Schema.ObjectId,
		ref: 'ElectricityReading',
		default: null
	},
	virtuals: {
		daily: {
			type: Number,
			default: null
		},
		monthPrediction: {
			type: Number,
			default: null			
		},
		yearPrediction: {
			type: Number,
			default: null			
		},
		yearCharge: {
			type: Number,
			default: null
		},
		monthsCharge: {
			type: Number,
			default: null
		}
	},	
	next: {
		type: Schema.ObjectId,
		ref: 'ElectricityReading',
		default: null
	}
});

ElectricityReadingSchema.statics.getLabels = function(callback) {
	callback(null, 
		{
			'actuals': [
				{'name': 'Date', 'key': 'date'}, 
				{'name': 'State', 'key': 'state'},
				{'name': 'Usage', 'key': 'usage'}
			],
			'virtuals': [
				{'name': 'Daily', 'key': 'daily'},
				{'name': 'Monthly prediction', 'key': 'monthPrediction'},
				{'name': 'Yearly prediction', 'key': 'yearPrediction'},
				{'name': 'Yearly charge', 'key': 'yearCharge'},
				{'name': '2 months charge', 'key': 'monthsCharge'}
			]
		}
	);
};

ElectricityReadingSchema.statics.getVirtuals = function(previousReading, reading, usage, callback) {
	function calculateCharge(yearly, electricityCharge) {
		var C = electricityCharge.C;
		var SSvn = electricityCharge.SSvn;
		var SZVnk = electricityCharge.SZVnk;
		var Sop = electricityCharge.Sop;
		var SoSJ = electricityCharge.SoSJ;

		return C * yearly + SSvn * 12 + SoSJ * yearly + SZVnk * yearly + Sop * 12;
	}

	usage = typeof usage !== 'undefined' ? usage : reading.usage ;

	var virtuals = {};

	if (previousReading !== null) {
		ElectricityCharge.findApplied(function(err, electricityCharge) {
			if (err) {
				return callback(err);
			}
			console.log(electricityCharge);
			virtuals.daily = usage / datetime.daysDiff(reading.date, previousReading.date);
			virtuals.monthPrediction = virtuals.daily * datetime.daysInMonth(reading.date);
			virtuals.yearPrediction = virtuals.daily * datetime.daysInYear(reading.date);			
			virtuals.yearCharge = calculateCharge(virtuals.yearPrediction, electricityCharge);
			console.log('virtuals.yearCharge', virtuals.yearCharge);
			console.log('electricityCharge.Os', electricityCharge.Os);
			virtuals.monthsCharge = virtuals.yearCharge / 6 + electricityCharge.Os;

			return callback(err, virtuals);		
		});
	} else {
		virtuals.daily = virtuals.monthPrediction = virtuals.yearPrediction = yearCharge = monthsCharge = null;
		return callback(null, virtuals);
	}
};

ElectricityReadingSchema.statics.updateExtendedWrapper = function(reading, callback) {
	var model = this;
	
	var updatedReading = {};
	updatedReading.date = reading.date;	
	updatedReading.state = reading.state;

	model.updateExtended(updatedReading, reading._id, function(err) {
		callback(err);
	});
};

module.exports = ElectricityReadingSchema;