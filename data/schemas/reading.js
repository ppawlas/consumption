var async = require('async');
var Schema = require('mongoose').Schema;
var datetime = require('../../helpers/datetime');

var ReadingSchema = new Schema({
	previous: {
		type: Schema.ObjectId,
		ref: 'Reading',
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
		ref: 'Reading',
		default: null
	}

});

ReadingSchema.statics.findExtended = function(options, callback) {
	/**
	 * Sets virtual attributes to the given reading.
	 * @param {object} reading Document with information about single reading.
	 * @param {function} callback Callback function.
	 */
	function setVirtuals(reading, callback) {
		function format(number) {
			return parseFloat(Math.round(number * 100) / 100).toFixed(2);
		}
		// virtual attributes are based on the previous reading
		if (reading.previous !== null) {
			reading.usage = format(reading.state - reading.previous.state);
			reading.daily = format(reading.usage / datetime.daysDiff(reading.date, reading.previous.date));
			reading.prediction = format(reading.daily * datetime.daysInMonth(reading.date)); // monthly prediction
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

ReadingSchema.statics.createExtended = function(reading, callback) {
	/**
	 * Finds id of the last reading saved so far
	 * or returns null if there are no readings yet.
	 * @param {function} callback Callback function.
	 */
	function findPreviousId(callback) {
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
	}

	// store model reference for closure
	var model = this;
	// find the previous reading
	findPreviousId(function(err, id) {
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

ReadingSchema.statics.deleteExtended = function(current, callback) {
	// store model reference for closure	
	var model = this;

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
			model.remove({ _id: current._id }, function(err) {
				if (err) {
					return callback(err);
				}
				return(callback(null));
			});
		}
	);	
};


module.exports = ReadingSchema;