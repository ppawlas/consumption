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
	usage: {
		type: Number,
		default: null
	},
	fixed: {
		type: Boolean,
		required: true,
		default: false
	},
	next: {
		type: Schema.ObjectId,
		ref: 'Reading',
		default: null
	}

});

ReadingSchema.statics.getLabels = function(callback) {
	callback(null, 
		{
			'actuals': ['Date', 'State', 'Usage'],
			'virtuals': ['Daily', 'Monthly prediction', 'Yearly prediction']
		}
	);
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
		reading.virtuals.daily = reading.usage / datetime.daysDiff(reading.date, reading.previous.date);
		reading.virtuals.prediction = reading.virtuals.daily * datetime.daysInMonth(reading.date); // monthly prediction
		reading.virtuals.yearly = reading.virtuals.daily * datetime.daysInYear(reading.date); // yearly prediction
	} else {
		reading.virtuals.daily = reading.virtuals.monthly = reading.virtuals.yearly = null;
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

/**
 * Finds the last reading saved so far
 * or returns null if there are no readings yet.
 * @param {function} callback Callback function.
 */
ReadingSchema.statics.findPreviousReading = function(callback) {
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
				return callback(null, reading);
			});
		}
	});		
};

ReadingSchema.statics.getUsage = function(previous, current) {
	// notNull is set if the first record should have the usage value defined
	var notNull = typeof this.notNull !== 'undefined' ? this.notNull : false;
	
	if (previous === null) {
		return notNull ? current.state : null;
	}

	return current.fixedUsage ? current.usage : current.state - previous.state;
};

ReadingSchema.statics.createExtended = function(reading, callback) {
	// store model reference for closure
	var model = this;
	// find the previous reading
	model.findPreviousReading(function(err, previousReading) {
		if (err) {
			return callback(err);
		}
		// add reference to the previous reading inside incoming data
		reading.previous = previousReading ? previousReading.id : null;
		// if there was no usage set, calculate it and put inside incoming data
		if (! reading.usage) {
			reading.usage = model.getUsage(previousReading, reading);
		}
		// create new document from incoming data
		model.create(reading, function(err, reading) {
			if (err) {
				return callback(err);
			}
			// update previous reading (if exists) with reference to the current one
			if (reading.previous !== null) {
				model.update({ _id: previousReading.id }, { $set: { next: reading._id }}, function(err) {
					if (err) {
						return callback(err);
					}
					// return afteru update
					return callback(null, reading);
				});
			} else {
				// return when there was no update
				return callback(null, reading);
			}
		});
	});
};

ReadingSchema.statics.updateExtended = function(reading, id, callback) {
	// store model reference for closure	
	var model = this;

	// find the previous and next reading
	async.parallel([
			function(next) {
				model.findOne( { next: id }, next);
			},
			function(next) {
				model.findOne( { previous: id }, next);
			}
		],
		function(err, results) {
			if (err) {
				return callback(err);
			}
			var previousReading = results[0];
			var nextReading = results[1];
			// if there was no usage set, calculate it and put inside incoming data
			if (! reading.usage) {
				reading.usage = model.getUsage(previousReading, reading);
			}
			// update current and next reading
			async.parallel([
					function(next) {
						model.update(
							{ _id: id },
							{ $set: reading },
							next
						);
					},
					function(next) {
						if (nextReading) {
							// calculate new usage of the next reading with respect to the current's state
							var nextUsage = model.getUsage(reading, nextReading);							
							// and update reading
							model.update(
								{ _id: nextReading._id },
								{ $set: { usage: nextUsage } },
								next
							);							
						} else {
							next();
						}
					}
				],
				function(err) {
					if (err) {
						return callback(err);
					}
					return(callback(null));					
				}
			);
		}
	);
};

ReadingSchema.statics.deleteExtended = function(current, callback) {
	// store model reference for closure	
	var model = this;
	// find the previous and next reading
	async.parallel([
			function(next) {
				model.findOne( { _id: current.previous }, next);
			},
			function(next) {
				model.findOne( { _id: current.next }, next);
			}
		],
		function(err, results) {
			if (err) {
				return callback(err);
			}
			var previousReading = results[0];
			var nextReading = results[1];
			// connect previous with next and update next's usage
			async.parallel([
					function(next) { 
						model.update( // update previous
							{ _id: current.previous },
							{ $set: { next: current.next }},
							next
						);
					},
					function(next) { 
						if (nextReading) {
							// calculate usage of the next reading with respect to the previous
							var nextUsage = model.getUsage(previousReading, nextReading);		
							// and update reading					
							model.update(
								{ _id: current.next },
								{ $set: { 
									previous: current.previous,
									usage: nextUsage
								}},
								next
							);							
						} else {
							next();
						}					
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
		}
	);
};

ReadingSchema.statics.importData = function(data, callback) {
	var model = this;
	// remove old data
	model.remove({ }, function(err) {
		if (err) {
			callback(err);
		}
		// insert new data
		async.forEachSeries(data, model.createExtended.bind(model), function(err) {
			if (err) {
				return callback(err);
			}
			return callback(null);
		});
	});
};


module.exports = ReadingSchema;