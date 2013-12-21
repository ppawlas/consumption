
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var flash = require('connect-flash');
var i18n = require('i18n');

var dbURL = 'mongodb://localhost/mydb';
var db = require('mongoose').connect(dbURL);

var app = express();

// i18n configure
i18n.configure({
	locales: ['en', 'pl'],
	cookie: 'i18nCookie',
	directory: path.join(__dirname, 'locales')
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('lazy otter'));
app.use(express.session({ maxAge: 60000 }));
app.use(flash());
app.use(i18n.init); // Should always before app.route
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

require('./helpers/datetime').locals(app);
require('./helpers/numeric').locals(app);

require('./routes/index')(app);
require('./routes/gasReadings')(app);
require('./routes/gasInvoices')(app);
require('./routes/electricityReadings')(app);
require('./routes/waterReadings')(app);
require('./routes/statistics')(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
