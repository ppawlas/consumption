module.exports.locals = function(app) {
	app.locals.round = function(number, precision) {
		precision = typeof precision !== 'undefined' ? precision : 2;

		return number ? parseFloat(Math.round(number * 100) / 100).toFixed(precision) : null;
	};
};