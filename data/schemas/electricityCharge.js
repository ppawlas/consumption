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
	}	

});

ElectricityChargeSchema.statics.getLabels = function(callback) {
	callback(null, ['C', 'SSvn', 'SZVnk', 'Sop','SoSJ', 'Os']);
};

ElectricityChargeSchema.statics.findExtended = function(callback) {
	var model = this;
	model.findOne({ }, function(err, electricityCharge) {
		if (err) {
			return callback(err);
		}
		if (! electricityCharge) {
			model.create({ }, function(err, electricityCharge) {
				if (err) {
					return callback(err);
				}
				return callback(null, electricityCharge);
			});
		} else {
			return callback(null, electricityCharge);
		}
	});
};

module.exports = ElectricityChargeSchema;