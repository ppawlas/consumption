var Schema = require('mongoose').Schema;
var ReadingSchema = require('./reading');
var extend = require('mongoose-schema-extend');

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

module.exports = GasReadingSchema;