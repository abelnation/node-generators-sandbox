var sinon = require('sinon');

var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var assert = chai.assert;

var Promise = require('bluebird');

describe('assert.eventually', function() {
	it('assert.eventually works correctly with promises', function() {
		return assert.eventually.equal(Promise.resolve('asdf'), 'asdf');
	});

	it('assert.eventually fails when it should', function() {
		return assert.isRejected(
			assert.eventually.equal(Promise.resolve('right'), 'wrong')
		);
	});
});

describe('bluebird library', function() {

	it('simple coroutine', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			return 'done';
		})();

		assert.instanceOf(result, Promise);
		return assert.eventually.equal(result, 'done');
	});

	it('coroutine returns promise', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			return Promise.resolve('value');
		})();

		assert.instanceOf(result, Promise);
		return assert.eventually.equal(result, 'value');
	});

	it('coroutine returns result of yielding a promise', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			return (yield Promise.resolve('value'));
		})();

		assert.instanceOf(result, Promise);
		return assert.eventually.equal(result, 'value');
	});

	it('simple coroutine, multiple yields', function() {
		var result = Promise.coroutine(function *slowAdd(a, b) {
			yield Promise.delay(100);
			var x = yield Promise.resolve(a);
			yield Promise.delay(100);
			var y = yield Promise.resolve(b);
			yield Promise.delay(100);
			return a + b;
		})(2, 3);

		return assert.eventually.equal(result, 5);
	});

	it('coroutine returns promise', function(done) {
		var coroutine = Promise.coroutine(function *() {
			var results = [];
			yield Promise.delay(200);
			return Promise.resolve('val');
		});

		coroutine().then(function(result) {
			assert.equal(result, 'val');
			done();
		}).catch(function(err) {
			done(err);
		});
	});

	it('returns coroutine promise to mocha', function() {
		return Promise.coroutine(function *() {
			var results = [];
			yield Promise.delay(200);
			return Promise.resolve('val').then(function(result) {
				assert.equal(result, 'val');
			});
		})();
	});

	it('coroutine throws error', function() {
		var coroutine = Promise.coroutine(function *() {
			var results = [];
			yield Promise.delay(200);
			throw new Error('gen error');
			return Promise.resolve('val');
		});
		
		return coroutine()
			.then(function() { throw new Error('should have thrown'); })
			.catch(function() { /* swallow error */ });
		
	});

	it('coroutine yields inner coroutine with yield', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			return yield Promise.coroutine(function *() {
				return yield Promise.resolve('val');
			})();
		})();

		return assert.eventually.equal(result, 'val');
	});

	it('coroutine uses yield* to delegate to inner generator', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			function *delay3Times() {
				yield Promise.delay(100);
				yield Promise.delay(100);
				yield Promise.delay(100);
			}
			yield *delay3Times();
			return Promise.resolve('vals');
		})();

		return assert.eventually.equal(result, 'vals');
	});

	it('coroutine uses yield* to return value', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			function *delay3Times() {
				yield Promise.delay(100);
				yield Promise.delay(100);
				yield Promise.delay(100);
				return 123;
			}
			return yield *delay3Times();
		})();

		return assert.eventually.equal(result, 123);
	});

	it('coroutine uses yield* to return a yielded promise', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			function *delay3Times() {
				yield Promise.delay(100);
				yield Promise.delay(100);
				yield Promise.delay(100);
				return yield Promise.resolve(123);
			}
			return yield *delay3Times();
		})();

		return assert.eventually.equal(result, 123);
	});

	it('coroutine uses yield* to return a naked promise', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			function *delay3Times() {
				yield Promise.delay(100);
				yield Promise.delay(100);
				yield Promise.delay(100);
				return Promise.resolve(123);
			}
			return yield *delay3Times();
		})();

		return assert.eventually.equal(result, 123);
	});

	it('when returning non-yielded promise, coroutine fully resolves promise chain, returning value', function() {
		var result = Promise.coroutine(function *() {
			yield Promise.delay(200);
			function *delay3Times() {
				yield Promise.delay(100);
				yield Promise.delay(100);
				yield Promise.delay(100);
				return Promise.resolve(123);
			}
			return yield *delay3Times();
		})();

		return result.then(function(v) {
			return assert.equal(v, 123);
		});
	});

	describe('errors', function() {

		it('when yielded promise rejects with error, can be try/caught parent generator', function() {
			var result = Promise.coroutine(function *() {
				try {
					yield Promise.reject('promise error');
				} catch (e) {
					return yield Promise.resolve('error caught');
				}

				throw new Error('error not caught');
			})();

			return assert.eventually.equal(result, 'error caught');
		});

		it('when yielded promise rejects with error, parent coroutine rejectes', function() {
			var result = Promise.coroutine(function *() {
				yield Promise.reject('promise error');
			})();
			return assert.isRejected(result);
		});

		it('inner coroutine yields error', function() {
			var result = Promise.coroutine(function *() {
				yield Promise.coroutine(function *() {
					throw new Error('inner error');
				})();
			})();

			return assert.isRejected(result);
		});

	});

	describe('coroutines using objects', function() {

		function Foo() {
			this.fooValue = 'foo';
		}
		Foo.prototype.doFooAsync = function *() {
			yield Promise.delay(100);
			this.fooValue = 'doFooAsync';
		};
		Foo.prototype.doFooCoroutine = Promise.coroutine(function *() {
			yield Promise.delay(100);
			this.fooValue = 'doFooCoroutine';
		});

		it('can invoke object methods', function() {
			var foo = new Foo();
			var result = Promise.coroutine(foo.doFooAsync.bind(foo))();
			return result.then(function() {
				assert.equal(foo.fooValue, 'doFooAsync');
			});
		});

		it('can invoke object methods', function() {
			var foo = new Foo();
			return foo.doFooCoroutine().then(function() {
				assert.equal(foo.fooValue, 'doFooCoroutine');
			});
		});

	});

});