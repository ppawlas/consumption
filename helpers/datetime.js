var TIMESPAN_DAY = 86400000;

module.exports.daysDiff = function(from, to) {
	return Math.floor( Math.abs(from - to) / TIMESPAN_DAY );
};

module.exports.daysInMonth = function(date) {
	var year = date.getFullYear();
	var month = date.getMonth(); // zero based
	// zeroth day of next month === last day of current month
	return new Date(year, month + 1, 0).getDate();
};

module.exports.isLeapYear = function(date) {
	var year = date.getFullYear();
	return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
};

module.exports.daysInYear = function(date) {
	return module.exports.isLeapYear(date) ? 366 : 365;
};
