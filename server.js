'use strict';
var http = require('http');
var express = require('express');
var Datastore = require('nedb');
var Keen = require('keen.io');
var baseit = require('baseit');
var ISBN = require('./isbn');

// setup server and database
var app = express();
var db = new Datastore({filename: 'links.db', autoload: true});
db.ensureIndex({fieldName: 'isbn', unique: true});

// setup keen.io logging
var client = Keen.configure({
	projectId: '550adb5c96773d150f3bb7ff',
	writeKey: '3bc0ba1da6a929bf450a568c679251726452c3b84c487285a6f8c2a4dc1ea7a4132c93241851de06dcabc9c309531d597e3eaa97fba01f7caf81ce9038db0e52415651197bb41c2ed16a262989cb8c962b15813f84362183f86f8e84b78803308b8334a1239763237b3c17534d6e65f2',
});

// health check
var healthcheck = {
	version: require('./package').version,
	http: 'okay'
};
// healthcheck info public
app.get(['/healthcheck'], function(req, res) {
	res.jsonp(healthcheck);
});


function getLink(str, website) {
	switch(website) {
		case 'goodreads':
			return 'https://www.goodreads.com/search?query='+str;
			break;
		case 'amazon':
			return 'http://www.amazon.co.uk/dp/'+ISBN.get10(str)+'?tag=thcdex-21';
			break;
		case 'bookdepository':
			return 'http://bookdepository.com/search?searchTerm='+str+'&a_id=char';
			break;
		default:
			return 'http://char.reviews/book/'+str;
	}
}
function createRecord(isbn, website) {
	var slug = isbn;
	baseit({input: ISBN.get13(isbn), from: 10, to: 36, digits: 9}, function (e, a) {slug = a;});
	var book = {
				isbn: isbn,
				slug: slug,
				links: {
					chareads: getLink(slug, 'chareads'),
					goodreads: getLink(isbn, 'goodreads'),
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

	// for decoding Base36 slugs
	if (isbn.length !== 10 && isbn.length !== 13) {
		baseit({
			input: isbn,
			from: 36,
			to: 10
		}, function (err, a) {
			if (err) throw err;
			// sometimes ISBNs have leading zeros, we need to add them back in
			if (a.length == 9) a = '0'+a
			if (a.length == 12) a = '0'+a
			isbn = a;
		});
	}

	if (url.length == 1) {
		website = 'chareads';
	} else {
		website = url[1];
	}
	if (website == 'gr') website = 'goodreads';
	if (website == 'amzn') website = 'amazon';
	if (website == 'bd') website = 'bookdepository';


	db.find({isbn: isbn}, function (err, docs) {
		if (docs.length > 0) {
			var newurl = docs[0].links[website];
		} else {
			var newurl = createRecord(isbn, website);
		}
		res.redirect(301, newurl);
		// res.send(newurl);

		// send event to keen.io
		client.addEvent('redirect', {'isbn': isbn, 'website': website});
	});

}

// deal w/ the routing
app.get(/\/([0-z]+)\/(\w+)\/?$/, social);
// for websiteless routing
app.get(/\/([0-z]+)\/?$/, social);


var server = app.listen(process.env.PORT || 4000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});
