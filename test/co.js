var sinon = require('sinon');
var assert = require('chai').assert;

var Promise = require('bluebird');
var co = require('co');

describe('co library', function() {

	function fooAsyncP() {
		return Promise.delay(500).then(function() { return 'foo'; });
	}
	function *barAsyncGen() {
		// use `return` instead of yield since we are *delegating* to this generator
		yield Promise.delay(500);
		return 'bar';
	}
	function bazSync() {
		return 'baz';
	}

	it('simple co example', function() {
		return co(function *() {
			var results = [];
			results.push( yield fooAsyncP() );
			results.push( yield barAsyncGen() );
			results.push( bazSync() );

			assert.deepEqual(results, [ 'foo', 'bar', 'baz' ]);
		});
	});

	it('co returns promise', function(done) {
		co(function *() {
			var results = [];
			results.push( yield fooAsyncP() );
			results.push( yield barAsyncGen() );
			results.push( bazSync() );
			return results;
		}).then(function(results) {
			assert.deepEqual(results, [ 'foo', 'bar', 'baz' ]);
			done();
		}).catch(function(err) {
			done(err);
		});
	});

	it('co example with error thrown', function(done) {
		co(function *() {
			var results = [];
			results.push( yield fooAsyncP() );
			results.push( yield (function () { throw new Error('gen error'); })() );
			results.push( bazSync() );

			done(new Error('should have thrown'));
		}).catch(function(err) {
			done();
		});
	});

	describe('co.wrap', function() {

	});

});