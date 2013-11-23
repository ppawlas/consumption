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

GasInvoiceSchema.statics.notNull = true;

GasInvoiceSchema.statics.getLabels = function(callback) {
	callback(null, 
		{
			'actuals': ['Date', 'State', 'Usage', 'Charge'],
			'virtuals': ['Price']
		}
	);
};

GasInvoiceSchema.statics.getCostsLabels = function(callback) {
	callback(null, ['Year', 'Cost', 'Usage', 'Ratio']);
};

GasInvoiceSchema.statics.findCosts = function(callback) {
	var model = this;

	model.aggregate({ 
		$group : {
			_id : { $year : '$date'},
			cost : { $sum : '$charge'},
			usage : { $sum : '$usage'}
		}}
	).exec(function(err, results) {
		if (err) {
			callback(err);
		}
		console.log(results);
		callback(null, null);
	});
};

/**
 * Sets virtual attributes to the given reading.
 * @param {object} reading Document with information about single reading.
 * @param {function} callback Callback function.
 */
GasInvoiceSchema.statics.setVirtuals = function(reading, callback) {
	// start with empty virtuals object
	reading.virtuals = {};
	reading.virtuals.price = reading.charge / reading.usage;

	// round virtual attributes
	for(var virtual in reading.virtuals) {
		reading.virtuals[virtual] = numeric.round(reading.virtuals[virtual], 2);
	}

	callback(null, reading);
};

module.exports = GasInvoiceSchema;