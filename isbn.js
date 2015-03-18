
function get10(isbn) {
	return changeTo(isbn, 10);
}
function get13(isbn) {
	return changeTo(isbn, 13);
}
function changeTo(isbn, len) {
	var prefix, ck, main;
	if (isbn.length == len) return isbn;
	main = isbn.length == 13 ? isbn.slice(3,12) : isbn.slice(0,8);
	console.log('main: '+main);
	prefix = isbn.length == 13 ? isbn.slice(0,2) : '978';
	if (len == 13) {
		return prefix+main+checkDigit(prefix+main);
	} else {
		return main+checkDigit(main);
	}
}

// check digit method from https://github.com/coolaj86/isbnjs
function checkDigit(isbn) {
	var c, n;
	if (isbn.match(/^\d{9}[\dX]?$/)) {
		c = 0;
		for (n = 0; n < 9; n += 1) {
			c += (10 - n) * isbn.charAt(n);
		}
		c = (11 - c % 11) % 11;
		return c === 10 ? 'X' : String(c);

	} else if (isbn.match(/(?:978|979)\d{9}[\dX]?/)) {
		c = 0;
		for (n = 0; n < 12; n += 2) {
			c += Number(isbn.charAt(n)) + 3 * isbn.charAt(n + 1);
		}
		return String((10 - c % 10) % 10);
	}
	return null;
}


var exports = module.exports = {};
exports.get10 = get10;
exports.get13 = get13;