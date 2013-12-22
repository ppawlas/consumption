var async = require('async');
var Schema = require('mongoose').Schema;

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
	}

});

ElectricityChargeSchema.statics.getLabels = function(callback) {
	callback(null, ['C', 'SSvn', 'SZVnk', 'Sop','SoSJ', 'Os']);
};

ElectricityChargeSchema.statics.findExtended = function(callback) {
	var model = this;
	model.find({ })
		.sort('appliesFrom')
		.exec(function(err, electricityCharges) {
			if (err) {
				return callback(err);
			}
			if (electricityCharges.length === 0) {
				model.create({ }, function(err, electricityCharge) {
					if (err) {
						return callback(err);
					}
					// return as array to preserve the convention
					return callback(null, [electricityCharge]);
				});
			} else {
				return callback(null, electricityCharges);
			}			
		});
};

ElectricityChargeSchema.statics.findApplied = function(callback) {

};

ElectricityChargeSchema.statics.updateReadings = function(err, docs) {
	var ElectricityReading = require('../models/electricityReading');
	async.forEachSeries(docs, ElectricityReading.updateExtendedWrapper.bind(ElectricityReading), function(err) {
		if (err) {
			return err;
		}
		return null;
	});				
};

ElectricityChargeSchema.statics.createExtended = function(electricityCharge, callback) {
	var model = this;
	var ElectricityReading = require('../models/electricityReading');

	model.create(electricityCharge, function(err, electricityCharge) {
		if (err) {
			return callback(err);
		}
		ElectricityReading.find({ date : { $gte: electricityCharge.appliesFrom }}, model.updateReadings);		
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
	};

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