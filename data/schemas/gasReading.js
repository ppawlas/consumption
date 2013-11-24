var Schema = require('mongoose').Schema;
var ReadingSchema = require('./reading');
var extend = require('mongoose-schema-extend');
var datetime = require('../../helpers/datetime');
var numeric = require('../../helpers/numeric');

var GasReadingSchema = ReadingSchema.extend({
	previous: {
		type: Schema.ObjectId,
		ref: 'GasReading',
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
		}
	},	
	next: {
		type: Schema.ObjectId,
		ref: 'GasReading',
		default: null
	}
});

GasReadingSchema.statics.getLabels = function(callback) {
	callback(null, 
		{
			'actuals': ['Date', 'State', 'Usage'],
			'virtuals': ['Daily', 'Monthly prediction']
		}
	);
};

GasReadingSchema.statics.getVirtuals = function(previousReading, reading, usage, callback) {
	usage = typeof usage !== 'undefined' ? usage : reading.usage ;

	var virtuals = {};

	if (previousReading !== null) {
		virtuals.daily = usage / datetime.daysDiff(reading.date, previousReading.date);
		virtuals.monthPrediction = virtuals.daily * datetime.daysInMonth(reading.date);
	} else {
		virtuals.daily = virtuals.monthPrediction = null;
	}

	callback(null, virtuals);
};

module.exports = GasReadingSchema;