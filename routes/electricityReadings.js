
/*
 * Electricity Routes
 */
var async = require('async');
var ElectricityReading = require('../data/models/electricityReading');
var ElectricityCharge = require('../data/models/electricityCharge');
var middleware = require('../middleware/electricity');
var routesHelper = require('../helpers/routes_helper');

module.exports = function(app) {

	routesHelper.setRoutes(app, ElectricityReading, middleware, '/electricityReadings', {'index': 'Electricity Consumption'});

	/*
	 * Electricity Charges routes
	 */
	app.get('/electricityCharges', function(req, res, next) {
		async.parallel([
				function(next) {
					ElectricityCharge.findExtended(next);
				},
				function(next) {
					ElectricityCharge.getLabels(next);
				}				
			], 
			function(err, results) {
				if (err) {
					return next(err);
				}
				var electricityCharges = results[0];
				var labels = results[1];	
				console.log(electricityCharges);

				res.render('helpers/charges', {
					title: res.__('Electricity Charges'),
					controllerPath: '/electricityCharges',
					electricityCharges: electricityCharges,					
					labels: labels
				});
			});
	});

	app.get('/electricityCharges/new', middleware.loadLabels, function(req, res, next) {
		res.render('helpers/new_edit_charge', {
			title: res.__('Electricity Charges') + ' - ' + res.__('New'),
			labels: req.labels
		});
	});

	app.get('/electricityCharges/:id', middleware.loadLabels, middleware.loadCharge, function(req, res, next) {
		res.render('helpers/new_edit_charge', {
			title: res.__('Electricity Charges') + ' - ' + res.__('Edit'),
			labels: req.labels,
			electricityCharge: req.reading
		});		
	});	

	app.put('/electricityCharges/:id', function(req, res, next) {
		ElectricityCharge.updateExtended(req.body, req.params.id,
			function(err) {
				if (err) {
					return next(err);
				}
				req.flash('alert-success', res.__('Data has been updated successfully!'));
				res.redirect('/electricityCharges');
			}
		);
	});

	app.post('/electricityCharges', function(req, res, next) {
		ElectricityCharge.createExtended(req.body, function(err) {
			if (err) {
				return next(err);
			}
			req.flash('alert-success', res.__('Data has been created successfully!'));
			res.redirect('/electricityCharges');
		});
	});	

};