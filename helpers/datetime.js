var TIMESPAN_DAY = 86400000;

module.exports.daysDiff = function(from, to) {
	return Math.floor( Math.abs(from - to) / TIMESPAN_DAY );
}