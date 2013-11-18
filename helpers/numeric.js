module.exports.round = function(number, precision) {
	return parseFloat(Math.round(number * 100) / 100).toFixed(precision);
}