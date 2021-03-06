var TIMESPAN_DAY = 86400000;

function zfill(part) {
	part = part.toString();
	if( part.length === 1 ) {
		part = '0' + part;
	}
	return part;
}

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

module.exports.greaterEqual = function(first, second) {
	first = toDate(first);
	second = toDate(second);

	return first >= second;
};

module.exports.greaterThan = function(first, second) {
	first = toDate(first);
	second = toDate(second);

	return first > second;
};

module.exports.dayBefore = function(date)  {
	var day = toDate(date);
	return day.setDate(day.getDate() - 1);
};

module.exports.locals = function(app) {
	app.locals.today = function() {
		var now = new Date();
		var today = now.getFullYear() + '-' + zfill(now.getMonth() + 1) + '-' + zfill(now.getDate());
		return today;		
	};

	app.locals.dateString = function(date) {
		if (date) {
			return date.getFullYear() + '-' + zfill(date.getMonth() + 1) + '-' + zfill(date.getDate());
		} else {
			return null;
		}
	};

	app.locals.formatPeriod = function(period) {
		var parts = period.split('-');
		var year = parts[0];
		var month = parts[1] < 10 ? '0' + parts[1] : parts[1];
		return year + '-' + month;
	};
};