var Schema = require('mongoose').Schema;
var ReadingSchema = require('./reading');
var extend = require('mongoose-schema-extend');

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

module.exports = ElectricityReadingSchema;