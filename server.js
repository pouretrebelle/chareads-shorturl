'use strict';
var express = require('express');


// setup server
var app = express();


// health check
var healthcheck = {
  version: require('./package').version,
  http: 'okay'
};
// healthcheck info public
app.get(['/healthcheck'], function(req, res) {
  res.jsonp(healthcheck);
});

function social(req, res, next) {
  var url = req.url.split('/').slice(1);
  var isbn = url[0];
  var website = url[1];
  console.dir(url);
}

// deal w/ the routing
app.route(/\/([0-9]+)\/(\w+)\/?$/).get(social);


var server = app.listen(process.env.PORT || 4000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
