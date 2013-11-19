var mongoose = require('mongoose');
var GasInvoiceSchema = require('../schemas/gasInvoice');

var GasInvoice = mongoose.model('GasInvoice', GasInvoiceSchema);

module.exports = GasInvoice;