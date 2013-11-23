var fs = require('fs'); 
var formidable = require('formidable');
var async = require('async');

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

module.exports.getData = function(app, model, controllerPath, title, links) {
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