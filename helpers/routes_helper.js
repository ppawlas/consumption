var fs = require('fs'); 
var formidable = require('formidable');
var async = require('async');
var common = require('../middleware/common');

module.exports.getFlashMessages = function(req) {
	var types = ['info', 'error'];
	var messages = {};
	types.forEach(function(type) {
		var message = req.flash(type);
		if (message.length > 0) {
			messages[type] = message;
		}
	});

	return messages;
};

module.exports.importData = function(app, model, controllerPath) {
	app.post(controllerPath + '/import', function(req, res, next) {
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			// check if the loaded file is not empty
			if (files.import.size > 0) {
				fs.readFile(files.import.path, 'utf8', function(err, data) {
					if (err) {
						return next(err);
					}

					model.importData(JSON.parse(data), function(err) {
						if (err) {
							return next(err);
						}
						req.flash('info', 'Data has been loaded successfully!');
						res.redirect(controllerPath);				
					});				
				});
			} else {
				req.flash('error', 'Data has not been loaded!');
				res.redirect(controllerPath);	
			}
		});
	});	
};

module.exports.getReadings = function(app, model, controllerPath, title, links) {
	links = typeof links !== 'undefined' ? links : [];

	var routesHelper = this;

	app.get(controllerPath, function(req, res, next) {
		var page = req.query.page && parseInt(req.query.page, 10) || 0;
		var maxPerPage = 500;
		async.parallel([
				function(next) {
					model.count(next);
				},
				function(next) {
					model.findExtended(
						{ 
							page: page,
							maxPerPage: maxPerPage
						},
						next
					);
				},
				function(next) {
					model.getLabels(next);
				}				
			],

			// final callback
			function(err, results) {
				if (err) {
					return next(err);
				}

				var count = results[0];
				var readings = results[1];
				var labels = results[2];

				var lastPage = (page + 1) * maxPerPage >= count;

				res.render('readings/index', {
					title: title,
					controllerPath: controllerPath + '/',
					labels: labels,
					readings: readings, 
					page: page,
					lastPage: lastPage,
					links: links,
					messages: routesHelper.getFlashMessages(req)
				});				
			}
		);
	});
};

module.exports.getNewReading = function(app, controllerPath, title) {
	title = typeof title !== 'undefined' ? title : 'New reading';

	app.get(controllerPath + '/new', function(req, res, next) {
		res.render('readings/new_edit', {
			title: title,
			controllerPath: controllerPath,
			labels: req.labels
		});
	});
};

module.exports.getReading = function(app, middleware, controllerPath, title) {
	title = typeof title !== 'undefined' ? title : 'Edit reading';

	app.get(controllerPath + '/:id', middleware.loadReading, function(req, res, next) {
		res.render('readings/new_edit', {
			title: title,
			controllerPath: controllerPath,
			reading: req.reading
		});
	});	
};

module.exports.putReading = function(app, model, controllerPath, redirectPath) {
	redirectPath = typeof redirectPath !== 'undefined' ? redirectPath : controllerPath;
	app.put(controllerPath + '/:id', common.setUsage, function(req, res, next) {
		model.updateExtended(req.body, req.params.id,
			function(err) {
				if (err) {
					return next(err);
				}
				req.flash('info', 'Data has updated successfully!');
				res.redirect(redirectPath);
			}
		);
	});
};

module.exports.delReading = function(app, model, middleware, controllerPath) {
	app.del(controllerPath + '/:id', middleware.loadReading, function(req, res, next) {
		model.deleteExtended(req.reading, function(err) {
			if(err) {
				return next(err);
			}
			req.flash('info', 'Data has deleted successfully!');
			res.redirect(controllerPath);
		});
	});	
};

module.exports.postReading = function(app, model, controllerPath) {
	app.post(controllerPath, common.setUsage, function(req, res, next) {
		model.createExtended(req.body, function(err) {
			if (err) {
				return next(err);
			}
			req.flash('info', 'Data has been created successfully!');
			res.redirect(controllerPath);
		});
	});	
};

module.exports.setRoutes = function(app, model, middleware, controllerPath, titles, links) {
	this.getReadings(app, model, controllerPath, titles.index, links);
	this.getNewReading(app, controllerPath, titles.new);
	this.getReading(app, middleware, controllerPath, titles.edit);
	this.putReading(app, model, controllerPath);
	this.delReading(app, model, middleware, controllerPath);
	this.postReading(app, model, controllerPath);
	this.importData(app, model, controllerPath);
};