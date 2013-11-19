var Schema = require('mongoose').Schema;
var ReadingSchema = require('./reading');
var extend = require('mongoose-schema-extend');
var numeric = require('../../helpers/numeric');

var GasInvoiceSchema = ReadingSchema.extend({
	previous: {
		type: Schema.ObjectId,
		ref: 'GasInvoice',
		default: null
	},
	charge: {
		type: Number,
		required: true
	},	
	next: {
		type: Schema.ObjectId,
		ref: 'GasInvoice',
		default: null
	}
});

GasInvoiceSchema.statics.getLabels = function(callback) {
	callback(null, 
		{
			'actuals': ['Date', 'State', 'Charge'],
			'virtuals': ['Usage', 'Price']
		}
	);
};

/**
 * Sets virtual attributes to the given reading.
 * @param {object} reading Document with information about single reading.
 * @param {function} callback Callback function.
 */
GasInvoiceSchema.statics.setVirtuals = function(reading, callback) {
	// start with empty virtuals object
	reading.virtuals = {};

	// virtual attributes are based on the previous reading
	if (reading.previous !== null) {
		reading.virtuals.usage = reading.state - reading.previous.state;
	} else {
		reading.virtuals.usage = reading.state;
	}

	reading.virtuals.price = reading.charge / reading.virtuals.usage;

	// round virtual attributes
	for(var virtual in reading.virtuals) {
		reading.virtuals[virtual] = numeric.round(reading.virtuals[virtual], 2);
	}

	callback(null, reading);
};

module.exports = GasInvoiceSchema;