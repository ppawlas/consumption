var GasInvoice = require('../data/models/gasInvoice');
var common = require('./common');

module.exports.loadReading = common.loadReading(GasInvoice);
module.exports.loadLabels = common.loadLabels(GasInvoice);