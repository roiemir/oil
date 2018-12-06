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

        it('Sequence selector', function () {
            var result = oil.parse('object { field: collection[x ? x == something -> x] }');
            assert.equal(result.length, 1);
            var obj = result[0];
            assert.equal(obj["!type"], "object");
            assert.equal(obj.field["!exp"], "s");
            assert.equal(obj.field.selection["!exp"], "i");
            assert.equal(obj.field.selection.identifier, "x");
        });
        it('Sequence selector with selector in condition', function () {
            var result = oil.parse('object { field: collection[x ? x == (something -> x)] }');
            assert.equal(result.length, 1);
            var obj = result[0];
            assert.equal(obj["!type"], "object");
            assert.equal(obj.field["!exp"], "s");
            assert.equal(obj.field.selection, null);
            assert.equal(obj.field.condition.left.identifier, "x");
            assert.equal(obj.field.condition.right["!exp"], "->");
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

    describe('Values', function () {
        it('Reference values', function () {
            var result = oil.parse('8 "text" box{} ');
            result = oil.parse('eight 8 text "text" box {}');
            assert.equal(result.length, 3);
            var number = result[0];
            var text = result[1];
            var obj = result[2];
            assert.equal(number["!ref"], "eight");
            assert.equal(number["!value"], 8);
            assert.equal(text["!ref"], "text");
            assert.equal(text["!value"], "text");
            assert.equal(obj["!type"], "box");
        });

        it('Object value', function () {
            var result = oil.parse('{number: 8, text: "eight", obj: {a: 1, b: "2" }}');
            assert.equal(result.length, 1);
        });
    });
});