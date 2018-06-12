var assert = require('assert');
var oil = require('../lib/oil.js');

describe('Expressions', function () {
    describe('Sequences', function () {
        it('sequence selector', function () {
            var result = oil.parse('states[x ? x.id == "id1" -> x]');
            assert.equal(result.length, 1);
            var expression = result[0];
            assert.equal(expression["!exp"], "s");
            assert.equal(expression.key, "x");
            assert.equal(expression.sequence["!exp"], "i");
            assert.equal(expression.sequence.identifier, "states");
            assert.equal(expression.condition["!exp"], "b");
            assert.equal(expression.selection["!exp"], "i");

        });

        it('ordered sequence', function () {
            var result = oil.parse('states[x ~ -x.time]');
            assert.equal(result.length, 1);
            var expression = result[0];
            assert.equal(expression["!exp"], "s");
            assert.equal(expression.key, "x");
            assert.equal(expression.sequence["!exp"], "i");
            assert.equal(expression.sequence.identifier, "states");

        });

    });

    describe('Selector', function () {
        it('selector operator', function () {
            var result = oil.parse('box {field: x -> x.value}');
            assert.equal(result.length, 1);
            var box = result[0];
            assert.equal(box["!type"], "box");
        });
    });

    describe('Objects', function () {
        it('empty object', function () {
            var result = oil.parse('box {}');
            assert.equal(result.length, 1);
            var box = result[0];
            assert.equal(box["!type"], "box");
        });
    });
});