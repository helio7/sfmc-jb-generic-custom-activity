'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');
const http = require('http');
const path = require('path');
const routes = require('./routes');
const activity = require('./routes/activity');

const app = express();

app.locals.token = {
  value: null,
  expiresAt: null,
};

// Configure Express
app.set('port', process.env.PORT || 4000);
app.use(bodyParser.raw({type: 'application/jwt'}));
app.get('/config.json', routes.configJson);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Express in Development Mode
if ('development' == app.get('env')) app.use(errorhandler());

app.get('/', routes.index);
app.post('/login', routes.login);
app.post('/logout', routes.logout);

// Custom Routes for Marketing Cloud.
app.post('/journeybuilder/save/', activity.save);
app.post('/journeybuilder/validate/', activity.validate);
app.post('/journeybuilder/publish/', activity.publish);
app.post('/journeybuilder/execute/', activity.execute);

http.createServer(app).listen(
  app.get('port'), () => {
    console.log('Express server listening on port ' + app.get('port'));
  }
);
