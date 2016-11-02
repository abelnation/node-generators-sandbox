var sinon = require('sinon');
var assert = require('chai').assert;

describe('Generators', function() {

	describe('basic behavior', function() {

		it('plain yield returns undefined', function() {
			function *yieldUndefined() {
				yield;
			}
			
			var it = yieldUndefined();
			assert.deepEqual(it.next(), { value: undefined, done: false }); // yielded value
			assert.deepEqual(it.next(), { value: undefined, done: true });  // return value
			assert.deepEqual(it.next(), { value: undefined, done: true });  // return value
		});

		it('yielding value', function() {
			function *yieldEcho(val) {
				yield val;
			}

			var val = 123;
			var it = yieldEcho(val);
			assert.deepEqual(it.next(), { value: val, done: false }); // yielded value
			assert.deepEqual(it.next(), { value: undefined, done: true });  // return value
			assert.deepEqual(it.next(), { value: undefined, done: true });  // will always be undefined after return value
		});

		it('yielding and returning value', function() {
			function *yieldEchoAndReturn(val) {
				yield val;
				return val;
			}
			
			var val = 123;
			var it = yieldEchoAndReturn(val);
			assert.deepEqual(it.next(), { value: val, done: false }); // yielded value
			assert.deepEqual(it.next(), { value: val, done: true });  // return value
			assert.deepEqual(it.next(), { value: undefined, done: true });  // value changes to undefined after return statement
		});

		it('yielding multiple times', function() {
			function *yieldEchoNTimes(val, nTimes) {
				for (var i = 0; i < nTimes; i++) {
					yield val;
				}
			}

			var val = 123;
			var nTimes = 5;
			var it = yieldEchoNTimes(val, nTimes);
			for (var i = 0; i < nTimes; i++) {
				assert.deepEqual(it.next(), { value: val, done: false });
			}
			assert.deepEqual(it.next(), { value: undefined, done: true });
		});

		it('yielding multiple times', function() {
			function *yieldValues(values) {
				for (var i = 0; i < values.length; i++) {
					yield values[i];
				}
			}

			var values = [ 2, 4, 6, 8, 0 ];
			var it = yieldValues(values);
			for (var i = 0; i < values.length; i++) {
				assert.deepEqual(it.next(), { value: values[i], done: false });
			}
			assert.deepEqual(it.next(), { value: undefined, done: true });
		});

		it('yielding multiple values', function() {
			function *yieldValues(values) {
				for (var i = 0; i < values.length; i++) {
					yield values[i];
				}
			}

			var values = [ 2, 4, 6, 8, 0 ];
			var it = yieldValues(values);
			for (var i = 0; i < values.length; i++) {
				assert.deepEqual(it.next(), { value: values[i], done: false });
			}
			assert.deepEqual(it.next(), { value: undefined, done: true });
		});

		it('passing values in to next', function() {
			function *yieldValueYieldResult(yieldVal, expectedVal) {
				var result = yield yieldVal;
				yield result;
			}

			var firstValue = 123;
			var secondValue = 246;
			var it = yieldValueYieldResult(firstValue, secondValue);

			// first call of next has no yield waiting on it, so don't pass in value yet
			assert.deepEqual(it.next(), { value: firstValue, done: false });
			// now has a yield waiting, so pass in our value
			assert.deepEqual(it.next(secondValue), { value: secondValue, done: false });
			// still waiting for function to return, final call to next will get (undefined)
			// ret val and mark as done
			assert.deepEqual(it.next(), { value: undefined, done: true });
		})

	});

	describe('quirks', function() {

		it('for..of loops over generator iterator does not include return value', function() {
			function *yieldThree() {
				yield 1;
				yield 2;
				yield 3;
				return 4;
			}

			var results = [];
			for (var i of yieldThree()) {
				results.push(i);
			}

			assert.deepEqual(results, [ 1, 2, 3 ]);
		});

		it('after return statement, next() returns val: undefined, done: true', function() {
			function *yieldEchoAndReturn(val) {
				yield val;
				return val;
			}
			
			var val = 123;
			var it = yieldEchoAndReturn(val);
			assert.deepEqual(it.next(), { value: val, done: false }); // yielded value
			assert.deepEqual(it.next(), { value: val, done: true });  // return value
			assert.deepEqual(it.next(), { value: undefined, done: true });  // value changes to undefined after return statement
		});

	});

	describe('error handling', function() {

		it('exception thrown by call to next', function() {
			function *yieldThrows() {
				throw new Error('error in generator');
				yield 'not received';
			}

			var it = yieldThrows();
			assert.throws(function() { it.next(); });
			assert.deepEqual(it.next(), { value: undefined, done: true });
			// Since function effectively returns at the `throw` statement, it is marked as done
			// assert.deepEqual(it.next(), { value: 'not received', done: false });
		});

		it('exception thrown by caller of next', function() {
			function *yieldReceivesError() {
				var x = yield;
				yield 'not received';
			}
			var it = yieldReceivesError();
			it.next();
			assert.throws(function() {
				// passing thrown error to next will cause generator to treat error as "thrown"
				it.throw(new Error('error passed to next'));
			});
			assert.deepEqual(it.next(), { value: undefined, done: true });
		});

		it('exception caught in generator', function() {
			function *yieldReceivesError(yieldVal, catchYieldVal) {
				try {
					var x = yield yieldVal;
				} catch (e) {
					yield catchYieldVal;	
				}
			}

			var val = 123;
			var catchVal = 'caught and continue';

			var it = yieldReceivesError(val, catchVal);
			assert.deepEqual(it.next(), { value: val, done: false });
			assert.deepEqual(it.throw(new Error('error passed to next')), { value: catchVal, done: false });
			assert.deepEqual(it.next(), { value: undefined, done: true });

		});

	});

	describe('delegating to other generators', function() {
		it('properly delegates to generator', function() {
			function *delegate(startVal, endVal) {
				for (var i = startVal; i < endVal; i++) {
					yield i;
				}
			}
			function *delegateToGenerator() {
				yield *delegate(11, 14);
			}

			var vals = [];
			for (var val of delegateToGenerator()) {
				vals.push(val);
			}

			assert.deepEqual(vals, [ 11, 12, 13 ]);
		});	
	});

});