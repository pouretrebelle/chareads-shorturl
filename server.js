'use strict';
var express = require('express');
var Datastore = require('nedb');
var ISBN = require('./isbn');

// setup server and database
var app = express();
var db = new Datastore({filename: 'links.db', autoload: true});
db.ensureIndex({fieldName: 'isbn', unique: true});


// health check
var healthcheck = {
	version: require('./package').version,
	http: 'okay'
};
// healthcheck info public
app.get(['/healthcheck'], function(req, res) {
	res.jsonp(healthcheck);
});


function getLink(isbn, website) {
	switch(website) {
		case 'amazon':
			return 'http://www.amazon.co.uk/dp/'+ISBN.get10(isbn)+'?tag=thcdex-21';
			break;
		case 'bookdepository':
			return 'http://bookdepository.com/search?searchTerm='+isbn+'&a_id=char';
			break;
		default:
			return 'http://char.reviews/book/'+ISBN.get13(isbn);
	}
}
function createRecord(isbn, website) {
	var book = {
				isbn: isbn,
				links: {
					chareads: getLink(isbn, 'chareads'),
					amazon: getLink(isbn, 'amazon'),
					bookdepository: getLink(isbn, 'bookdepository')
				}
			};
	db.insert(book, function(err) {
		if (err) console.log(err);
	});
	return book.links[website];
}


function social(req, res, next) {
	var url, isbn, website;
	url = req.url.split('/').filter(function(n){return n != ''});
	isbn = url[0];
	if (url.length == 1) {
		website = 'chareads';
	} else {
		website = url[1];
	}
	if (website == 'amzn') website = 'amazon';
	if (website == 'bd') website = 'bookdepository';


	db.find({isbn: isbn}, function (err, docs) {
		if (docs.length > 0) {
			var newurl = docs[0].links[website];
		} else {
			var newurl = createRecord(isbn, website);
		}
		res.redirect(301, newurl);
		//res.send(newurl);
	});

}

// deal w/ the routing
app.get(/\/([0-9]+)\/(\w+)\/?$/, social);
// for websiteless routing
app.get(/\/([0-9]+)\/?$/, social);


var server = app.listen(process.env.PORT || 4000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});
