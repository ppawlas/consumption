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
	virtuals: {
		price: {
			type: Number,
			default: null
		}
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
			'actuals': [
				{'name': 'Date', 'key': 'date'}, 
				{'name': 'State', 'key': 'state'},
				{'name': 'Usage', 'key': 'usage'},
				{'name': 'Charge', 'key': 'charge'}				
			],
			'virtuals': [
				{'name': 'Price', 'key': 'price'}
			]			
		}
	);
};

GasInvoiceSchema.statics.getVirtuals = function(previousReading, reading, usage, callback) {
	usage = typeof usage !== 'undefined' ? usage : reading.usage ;

	var virtuals = {};
	virtuals.price = reading.charge / usage;	

	callback(null, virtuals);
};

GasInvoiceSchema.statics.findCosts = function(callback) {
	var model = this;

	model.aggregate({ 
		$group : {
			_id : { $year : '$date'},
			cost : { $sum : '$charge'},
			usage : { $sum : '$usage'}
		}},
		{$sort : { 
			_id : -1
		}}
	).exec(function(err, results) {
		if (err) {
			callback(err);
		}
		callback(null, results);
	});
};

module.exports = GasInvoiceSchema;