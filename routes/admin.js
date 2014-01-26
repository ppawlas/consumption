var exec = require('child_process').exec;
var path = require('path');
var routesHelper = require('../helpers/routes_helper');
var dbName = 'mydb';
var backupDir = path.join(__dirname, '../backup');

module.exports = function(app) {

	app.get('/admin', function(req, res, next) {
		res.render('helpers/admin', {
			title: res.__('Administration'),
			dir: backupDir,
			messages: routesHelper.getFlashMessages(req)
		});
	});

	app.post('/admin/restore', function(req, res, next) {
		Array.prototype.max = function() {
			return Math.max.apply(null, this);
		};

		var ls = exec('ls ' + backupDir, function(error, stdout, stderr) {
			if (error) {
				req.flash('alert-danger', res.__('Database has not been restored!'));
				res.redirect('/admin');		
			} else {
				var backups = stdout.split('\n');
				var newest = backups.max();
				var backupPath = path.join(backupDir, newest.toString());

				var mongorestore = exec('mongorestore ' + backupPath, function(error, stdout, stderr) {
					if (error) {
						return next(error);
					}

					if (stdout.match('ERROR') === null) {
						req.flash('alert-success', res.__('Database has been restored successfully!'));
					} else {
						req.flash('alert-danger', res.__('Database has not been restored!'));
					}
					
					res.redirect('/admin');
				});
			}
		});


	});

	app.post('/admin/dump', function(req, res, next) {
		var backupPath = path.join(backupDir, (new Date()).getTime().toString());
		var child = exec('mongodump -d ' + dbName + ' -o ' + backupPath, function(error, stdout, stderr) {
			if (error) {
				return next(error);
			}

			if (stdout.match('ERROR') === null) {
				req.flash('alert-success', res.__('Database has been stored successfully!'));
			} else {
				req.flash('alert-danger', res.__('Database has not been stored!'));
			}

			res.redirect('/admin');				
		});
	});

};