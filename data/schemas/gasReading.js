var async = require('async');
var Schema = require('mongoose').Schema;
var datetime = require('../../helpers/datetime');

var GasReadingSchema = new Schema({
	previous: {
		type: Schema.ObjectId,
		ref: 'GasReading',
		default: null
	},
	date: {
		type: Date,
		required: true
	},
	state: {
		type: Number,
		required: true
	},
	next: {
		type: Schema.ObjectId,
		ref: 'GasReading',
		default: null
	}	
});

GasReadingSchema.statics.findExtended = function(options, callback) {
	/**
	 * Sets virtual attributes to the given reading.
	 * @param {object} reading Document with information about single reading.
	 * @param {function} callback Callback function.
	 */
	function setVirtuals(reading, callback) {
		// virtual attributes are based on the previous reading
		if (reading.previous !== null) {
			reading.usage = reading.state - reading.previous.state;
			reading.daily = reading.usage / datetime.daysDiff(reading.date, reading.previous.date);
			reading.prediction = reading.daily * 30; // monthly prediction
		}
		callback(null, reading);
	}

	// find readings for the given page
	this.find({ })
		.sort('date')
		.skip(options.page * options.maxPerPage)
		.limit(options.maxPerPage)
		.populate('previous') // load information about the previous reading
		.exec(function(err, result) {
			// extend result with the virtual attributes
			async.map(result, setVirtuals, function(err, readings) {
				callback(err, readings);
			});
		});	
};

GasReadingSchema.statics.createReading = function(reading, callback) {
	// store model reference for closure
	var model = this;
	// find the previous reading
	model.findPreviousId(function(err, id) {
		if (err) {
			return callback(err);
		}
		// add reference to the previous reading inside incoming data
		reading.previous = id;
		// create new document from incoming data
		model.create(reading, function(err, reading) {
			if (err) {
				return callback(err);
			}
			// update previous reading (if exists) with reference to the current one
			if (reading.previous !== null) {
				model.update( 
					{ _id: id },
					{ $set: { next: reading._id }},
					function(err) {
						if (err) {
							return callback(err);
						}
					}
				);
			}
			return callback(null, reading);
		});
	});
};

GasReadingSchema.statics.findPreviousId = function(callback) {
	// store model reference for closure	
	var model = this;
	// callculate total amount of readings
	model.count({ }, function(err, count) {
		if (err) {
			return callback(err);
		}
		if (count === 0) {
			return callback(null, null); // no readings yet
		} else {
			// if there are some readings, find the last one
			model.findOne( { next: null }, function(err, reading) {
				if (err) {
					return callback(err);
				}
				return callback(null, reading._id);
			});
		}
	});
};

GasReadingSchema.statics.deleteExtended = function(id, callback) {
	// store model reference for closure	
	var model = this;

	// get current reading
	model.findOne({ _id: id }, function(err, current) {
		if (err) {
			return callback(err);
		}

		// connect previous with next
		async.parallel([
				function(next) { 
					model.update( // update previous
						{ _id: current.previous },
						{ $set: { next: current.next }},
						next
					);
				},
				function(next) { 
					model.update( // update next
						{ _id: current.next },
						{ $set: { previous: current.previous }},
						next
					);					
				}
			],

			// delete current reading
			function(err) {
				if (err) {
					return callback(err);
				}
				model.remove({ _id: id }, function(err) {
					if (err) {
						return callback(err);
					}
					return(callback(null));
				});
			}
		);	
	});
};


module.exports = GasReadingSchema;