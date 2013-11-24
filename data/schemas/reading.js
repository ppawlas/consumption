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
	virtuals: {
		daily: {
			type: Number,
			default: null
		},
		monthPrediction: {
			type: Number,
			default: null			
		},
		yearPrediction: {
			type: Number,
			default: null			
		}
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
			'actuals': [
				{'name': 'Date', 'key': 'date'}, 
				{'name': 'State', 'key': 'state'},
				{'name': 'Usage', 'key': 'usage'}
			],
			'virtuals': [
				{'name': 'Daily', 'key': 'daily'},
				{'name': 'Monthly prediction', 'key': 'monthPrediction'},
				{'name': 'Yearly prediction', 'key': 'yearPrediction'}
			]
		}
	);
};

ReadingSchema.statics.findExtended = function(options, callback) {
	// store model reference for closure
	var model = this;
	// find readings for the given page
	model.find({ })
		.sort('date')
		.skip(options.page * options.maxPerPage)
		.limit(options.maxPerPage)
		.exec(function(err, result) {
			callback(err, result);
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

ReadingSchema.statics.getVirtuals = function(previousReading, reading, usage, callback) {
	usage = typeof usage !== 'undefined' ? usage : reading.usage ;

	var virtuals = {};

	if (previousReading !== null) {
		virtuals.daily = usage / datetime.daysDiff(reading.date, previousReading.date);
		virtuals.monthPrediction = virtuals.daily * datetime.daysInMonth(reading.date);
		virtuals.yearPrediction = virtuals.daily * datetime.daysInYear(reading.date);
	} else {
		virtuals.daily = virtuals.monthPrediction = virtuals.yearPrediction = null;
	}

	callback(null, virtuals);
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
		// set virtuals and put them inside incoming data and proceed
		model.getVirtuals(previousReading, reading, undefined, function(err, virtuals) {
			if (err) {
				return callback(err);
			}
			reading.virtuals = virtuals;

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
						// return after update
						return callback(null, reading);
					});
				} else {
					// return when there was no update
					return callback(null, reading);
				}
			});			
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
			model.getVirtuals(previousReading, reading, undefined, function(err, virtuals) {
				if (err) {
					return callback(err);
				}
				reading.virtuals = virtuals;
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
								// calculate new virtuals of the next reading with respect to the current's state
								model.getVirtuals(reading, nextReading, nextUsage, function(err, virtuals) {	
									if (err) {
										return callback(err);
									}									
									var nextVirtuals = virtuals;
									// and update reading
									model.update(
										{ _id: nextReading._id },
										{ $set: { usage: nextUsage, virtuals: nextVirtuals } },
										next
									);										
								});																			
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
			});	
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
							// calculate new virtuals of the next reading with respect to the current's state
							model.getVirtuals(previousReading, nextReading, nextUsage, function(err, virtuals) {	
								if (err) {
									return callback(err);
								}										
								var nextVirtuals = virtuals;
								// and update reading					
								model.update(
									{ _id: current.next },
									{ $set: { 
										previous: current.previous,
										usage: nextUsage,
										virtuals: nextVirtuals
									}},
									next
								);									
							});														
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

ReadingSchema.statics.getStatistics = function(limits, callback) {

	var model = this;

	model.aggregate()
		.match( limits )	
		.group({
			_id : { 
				year : { $year : '$date' },
				month : { $month : '$date' }
			},
			average : { $avg : '$virtuals.daily'},
		})
		.sort({ _id : 1 })
		.exec(function(err, results) {
			if (err) {
				callback(err);
			}
			callback(null, results);
	});
};


module.exports = ReadingSchema;