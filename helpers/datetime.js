var TIMESPAN_DAY = 86400000;

function toDate(date) {
	return typeof date === 'string' ? new Date(date) : date;
}

module.exports.daysDiff = function(from, to) {
	from = toDate(from);
	to = toDate(to);

	return Math.floor( Math.abs(from - to) / TIMESPAN_DAY );
};

module.exports.daysInMonth = function(date) {
	date = toDate(date);

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
	date = toDate(date);

	return module.exports.isLeapYear(date) ? 366 : 365;
};

module.exports.greaterThan = function(first, second) {
	first = toDate(first);
	second = toDate(second);

	return first > second;
};

module.exports.locals = function(app) {
	app.locals.today = function() {
		var now = new Date();
		var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		return today;		
	}
};