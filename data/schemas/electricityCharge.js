var async = require('async');
var Schema = require('mongoose').Schema;
var datetime = require('../../helpers/datetime');

var ElectricityChargeSchema = new Schema({
	C: {
		type: Number,
		required: true,
		default: 0.3392
	},
	SSvn: {
		type: Number,
		required: true,
		default: 9.2496
	},
	SZVnk: {
		type: Number,
		required: true,
		default: 0.142557
	},
	Sop: {
		type: Number,
		required: true,
		default: 4.7601
	},
	SoSJ: {
		type: Number,
		required: true,
		default: 0.007995
	},
	Os: {
		type: Number,
		required: true,
		default: 23.79
	},
	appliesFrom: {
		type: Date,
		default: null
	},
	appliesTo: {
		type: Date,
		default: null
	}

});

ElectricityChargeSchema.statics.getLabels = function(callback) {
	callback(null, ['C', 'SSvn', 'SZVnk', 'Sop','SoSJ', 'Os']);
};

ElectricityChargeSchema.statics.createDefault = function(callback) {
	var model = this;

	model.create({ }, function(err, electricityCharge) {
		if (err) {
			return callback(err);
		}
		return callback(null, electricityCharge);
	});	
};

ElectricityChargeSchema.statics.findExtended = function(callback) {
	var model = this;

	model.count({ }, function(err, cnt) {
		if (cnt === 0) {
			model.createDefault(function(err, electricityCharge) {
				if (err) {
					return callback(err);
				} else {
					return callback(null, [electricityCharge]);
				}
			});			
		} else {
			model
			.find({ })
			.sort('-appliesFrom')
			.exec(function(err, electricityCharges) {
				if (err) {
					return callback(err);
				} else {
					return callback(null, electricityCharges);
				}			
			});			
		}
	});
};

ElectricityChargeSchema.statics.findNewest = function(callback) {
	this
	.find({ })
	.limit(1)
	.sort('-appliesFrom')
	.exec(callback);
};

ElectricityChargeSchema.statics.findForDate = function(readingDate, callback) {
	this
	.find({
		$or: [
				{ appliesFrom : { $lte: readingDate  } },
				{ appliesFrom : null }
		]
	})
	.limit(1)
	.sort('-appliesFrom')
	.exec(callback);	
};

ElectricityChargeSchema.statics.findApplied = function(readingDate, callback) {

	var model = this;

	model.count({ }, function(err, cnt) {
		if (cnt === 0) {
			model.createDefault(function(err, electricityCharge) {
				if (err) {
					return callback(err);
				} else {
					return model.findForDate(readingDate, callback);
				}
			});
		} else {
			return model.findForDate(readingDate, callback);
		}
	});
};

ElectricityChargeSchema.statics.createExtended = function(electricityCharge, callback) {
	function updateReadings(err, docs) {
		var ElectricityReading = require('../models/electricityReading');
		async.forEachSeries(docs, ElectricityReading.updateExtendedWrapper.bind(ElectricityReading), function(err) {
			if (err) {
				return callback(err);
			}
			return callback(null);
		});				
	}

	var model = this;
	var ElectricityReading = require('../models/electricityReading');

	model.findNewest(function(err, newestCharge) {
		if (err) {
			return callback(err);
		} else {
			var newest = newestCharge[0];
			if (datetime.greaterEqual(newest.appliesFrom, electricityCharge.appliesFrom)) {
				return callback('New date must be greater than the previous one');
			} else {
				model.findForDate(electricityCharge.appliesFrom, function(err, electricityCharges) {
					if (err) {
						return callback(err);
					} else {
						var previousCharge = electricityCharges[0];		
						model.findByIdAndUpdate(previousCharge.id, { appliesTo: datetime.dayBefore(electricityCharge.appliesFrom) }, function(err) {
							if (err) {
								return callback(err);
							} else {
								model.create(electricityCharge, function(err, electricityCharge) {
									if (err) {
										return callback(err);
									} else {
										ElectricityReading.find({ date : { $gte: electricityCharge.appliesFrom }}, updateReadings);
									}
								});
							}
						});
					}
				});
			}
		}
	});
};

ElectricityChargeSchema.statics.updateExtended = function(charges, id, callback) {
	function updateReadings(err, docs) {
		var ElectricityReading = require('../models/electricityReading');
		async.forEachSeries(docs, ElectricityReading.updateExtendedWrapper.bind(ElectricityReading), function(err) {
			if (err) {
				return callback(err);
			}
			return callback(null);
		});				
	}

	var model = this;	
	var ElectricityReading = require('../models/electricityReading');

	model.update(
		{ _id: id },
		{ $set: charges },
		function(err) {
			if (err) {
				return callback(err);
			}

			model.findOne({ _id: id }, function(err, charges) {
				if (err) {
					return callback(err);
				}
				if (charges.appliesFrom) {
					ElectricityReading.find({ date : { $gte: charges.appliesFrom }}, updateReadings);
				} else {
					ElectricityReading.find({ }, updateReadings);
				}
			});
		}
	);
};

module.exports = ElectricityChargeSchema;