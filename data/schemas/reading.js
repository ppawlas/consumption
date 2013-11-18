var async = require('async');
var Schema = require('mongoose').Schema;
var datetime = require('../../helpers/datetime');
var numeric = require('../../helpers/numeric');

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

ReadingSchema.statics.getLabels = function(callback) {
	callback(null, ['Date', 'State', 'Usage', 'Daily', 'Monthly prediction', 'Yearly prediction']);
};

/**
 * Sets virtual attributes to the given reading.
 * @param {object} reading Document with information about single reading.
 * @param {function} callback Callback function.
 */
ReadingSchema.statics.setVirtuals = function(reading, callback) {
	// start with empty virtuals object
	reading.virtuals = {};

	// virtual attributes are based on the previous reading
	if (reading.previous !== null) {
		reading.virtuals.usage = reading.state - reading.previous.state;
		reading.virtuals.daily = reading.virtuals.usage / datetime.daysDiff(reading.date, reading.previous.date);
		reading.virtuals.prediction = reading.virtuals.daily * datetime.daysInMonth(reading.date); // monthly prediction
		reading.virtuals.yearly = reading.virtuals.daily * datetime.daysInYear(reading.date); // yearly prediction
	} else {
		reading.virtuals.usage = reading.virtuals.daily = reading.virtuals.monthly = reading.virtuals.yearly = null;
	}

	// round virtual attributes
	for(var virtual in reading.virtuals) {
		reading.virtuals[virtual] = reading.virtuals[virtual] && numeric.round(reading.virtuals[virtual], 2);
	}

	callback(null, reading);
};

ReadingSchema.statics.findExtended = function(options, callback) {
	// store model reference for closure
	var model = this;
	// find readings for the given page
	model.find({ })
		.sort('date')
		.skip(options.page * options.maxPerPage)
		.limit(options.maxPerPage)
		.populate('previous') // load information about the previous reading
		.exec(function(err, result) {
			// extend result with the virtual attributes
			async.map(result, model.setVirtuals, function(err, readings) {
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