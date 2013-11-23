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

/**
 * Sets virtual attributes to the given reading.
 * @param {object} reading Document with information about single reading.
 * @param {function} callback Callback function.
 */
GasReadingSchema.statics.setVirtuals = function(reading, callback) {
	// start with empty virtuals object
	reading.virtuals = {};

	// virtual attributes are based on the previous reading
	if (reading.previous !== null) {
		reading.virtuals.daily = reading.usage / datetime.daysDiff(reading.date, reading.previous.date);
		reading.virtuals.prediction = reading.virtuals.daily * datetime.daysInMonth(reading.date); // monthly prediction
	} else {
		reading.virtuals.daily = reading.virtuals.monthly = null;
	}

	// round virtual attributes
	for(var virtual in reading.virtuals) {
		reading.virtuals[virtual] = reading.virtuals[virtual] && numeric.round(reading.virtuals[virtual], 2);
	}

	callback(null, reading);
};

module.exports = GasReadingSchema;