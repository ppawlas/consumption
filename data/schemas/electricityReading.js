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
	next: {
		type: Schema.ObjectId,
		ref: 'ElectricityReading',
		default: null
	}
});

ElectricityReadingSchema.statics.getLabels = function(callback) {
	callback(null, 
		{
			'actuals': ['Date', 'State'],
			'virtuals': ['Usage', 'Daily', 'Monthly prediction', 'Yearly prediction', 'Yearly charge', '2 months charge']
		}
	);
};

/**
 * Sets virtual attributes to the given reading.
 * @param {object} reading Document with information about single reading.
 * @param {function} callback Callback function.
 */
ElectricityReadingSchema.statics.setVirtuals = function(reading, callback) {
	function calculateCharge(yearly, electricityCharge) {
		var C = electricityCharge.C;
		var SSvn = electricityCharge.SSvn;
		var SZVnk = electricityCharge.SZVnk;
		var Sop = electricityCharge.Sop;
		var SoSJ = electricityCharge.SoSJ;

		return C * yearly + SSvn * 12 + SoSJ * yearly + SZVnk * yearly + Sop * 12;
	}
	// start with empty virtuals object
	reading.virtuals = {};

	// virtual attributes are based on the previous reading
	if (reading.previous !== null) {
		ElectricityCharge.findExtended(function(err, electricityCharge) {
			if (err) {
				return callback(err);
			}
			reading.virtuals.usage = reading.state - reading.previous.state;
			reading.virtuals.daily = reading.virtuals.usage / datetime.daysDiff(reading.date, reading.previous.date);
			reading.virtuals.prediction = reading.virtuals.daily * datetime.daysInMonth(reading.date); // monthly prediction
			reading.virtuals.yearly = reading.virtuals.daily * datetime.daysInYear(reading.date); // yearly prediction
			reading.virtuals.charge = calculateCharge(reading.virtuals.yearly, electricityCharge);
			reading.virtuals.charge2months = reading.virtuals.charge / 6 + electricityCharge.Os;


				// round virtual attributes
				for(var virtual in reading.virtuals) {
					reading.virtuals[virtual] = reading.virtuals[virtual] && numeric.round(reading.virtuals[virtual], 2);
				}

				callback(null, reading);			
		});

	} else {
		reading.virtuals.usage = reading.virtuals.daily = reading.virtuals.monthly = reading.virtuals.yearly = reading.virtuals.charge = reading.virtuals.charge2months = null;
		callback(null, reading);	
	}
};

module.exports = ElectricityReadingSchema;