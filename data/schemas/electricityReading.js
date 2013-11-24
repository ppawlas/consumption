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
			'actuals': ['Date', 'State', 'Usage'],
			'virtuals': ['Daily', 'Monthly prediction', 'Yearly prediction', 'Yearly charge', '2 months charge']
		}
	);
};

ElectricityReadingSchema.statics.getVirtuals = function(previousReading, reading, usage, callback) {
	console.log('hello virtuals');
	console.log(callback);
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
		ElectricityCharge.findExtended(function(err, electricityCharge) {
			if (err) {
				return callback(err);
			}
			virtuals.daily = usage / datetime.daysDiff(reading.date, previousReading.date);
			virtuals.monthPrediction = virtuals.daily * datetime.daysInMonth(reading.date);
			virtuals.yearPrediction = virtuals.daily * datetime.daysInYear(reading.date);			
			virtuals.yearCharge = calculateCharge(virtuals.yearPrediction, electricityCharge);
			virtuals.monthsCharge = virtuals.yearCharge / 6 + electricityCharge.Os;

			return callback(err, virtuals);		
		});
	} else {
		virtuals.daily = virtuals.monthPrediction = virtuals.yearPrediction = yearCharge = monthsCharge = null;
		return callback(null, virtuals);
	}
};

module.exports = ElectricityReadingSchema;