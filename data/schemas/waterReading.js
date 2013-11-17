var Schema = require('mongoose').Schema;
var ReadingSchema = require('./reading');
var extend = require('mongoose-schema-extend');

var WaterReadingSchema = ReadingSchema.extend({
	previous: {
		type: Schema.ObjectId,
		ref: 'WaterReading',
		default: null
	},
	next: {
		type: Schema.ObjectId,
		ref: 'WaterReading',
		default: null
	}
});

module.exports = WaterReadingSchema;