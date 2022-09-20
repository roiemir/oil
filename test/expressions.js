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

        it('sequence selector with index', function () {
            var result = oil.parse('list[x, i ? x.id == "id1" || i < 2 -> x]');
            assert.equal(result.length, 1);
            var expression = result[0];
            assert.equal(expression["!exp"], "s");
            assert.equal(expression.key, "x");
            assert.equal(expression.index, "i");
            assert.equal(expression.sequence["!exp"], "i");
            assert.equal(expression.sequence.identifier, "list");
            assert.equal(expression.condition["!exp"], "||");
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
            assert.equal(expression.order["!exp"], "u");
            assert.equal(expression.order.operator, "-");
            assert.equal(expression.order.argument["!exp"], "f");
            assert.equal(expression.order.argument.field, "time");


        });

        it('groups sequence', function () {
            var result = oil.parse('states[x ~= -x.time]');
            assert.equal(result.length, 1);
            var expression = result[0];
            assert.equal(expression["!exp"], "s");
            assert.equal(expression.key, "x");
            assert.equal(expression.sequence["!exp"], "i");
            assert.equal(expression.sequence.identifier, "states");
            assert.equal(expression.group["!exp"], "u");
            assert.equal(expression.group.operator, "-");
            assert.equal(expression.group.argument["!exp"], "f");
            assert.equal(expression.group.argument.field, "time");
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

    describe('Conditional', function () {
        it('Basic conditional', function () {
            var result = oil.parse('cond ? pos : neg');
            assert.equal(result.length, 1);
            var cond = result[0];
            assert.equal(cond["!exp"], "?:");
        });

        it('Partial conditional', function () {
            var result = oil.parse('cond ? pos');
            assert.equal(result.length, 1);
            var cond = result[0];
            assert.equal(cond["!exp"], "?:");
        });
    });

    describe('Objects', function () {
        it('empty object', function () {
            var result = oil.parse('box {}');
            assert.equal(result.length, 1);
            var box = result[0];
            assert.equal(box["!type"], "box");
        });

        it('init empty object', function () {
            var result = oil.parse('box()');
            assert.equal(result.length, 1);
            var box = result[0];
            assert.equal(box["!type"], "box");
        });

        it('object width fields and items', function () {
            var result = oil.parse('box { a: 1, b: "text", c: [2, 1, 3], [ child() ] }');
            assert.equal(result.length, 1);
            var box = result[0];
            assert.equal(box["!type"], "box");
            assert.equal(box.a, 1);
            assert.equal(box.b, "text");
            assert.equal(box.c.length, 3);
            assert.equal(box["!items"].length, 1);
            assert.equal(box["!items"][0]["!type"], "child");
        });

        it('nested object', function () {
            var box = oil.parseOne('ref1 box(1, 2) ref2 child {}');
            assert.equal(box["!type"], "box");
            assert.equal(box["!init"][0], 1);
            assert.equal(box["!init"][1], 2);
            assert.equal(box["!items"].length, 1);
            assert.equal(box["!items"][0]["!type"], "child");
        });

        it('nested object not parsed on root', function () {
            var result = oil.parse('ref1 box(1, 2) ref2 box {}');
            assert.equal(result.length, 2);
            var box = result[0];
            assert.equal(box["!type"], "box");
            assert.equal(box["!init"][0], 1);
            assert.equal(box["!init"][1], 2);
            assert.equal(box["!items"], null);
            box = result[1];
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

        it('Compound number single integer', function () {
            var result = oil.parse('item { value: 1k }');
            assert.equal(result.length, 1);
            var item = result[0];
            var compound = item.value["!compound"];
            assert.ok(compound);
            assert.equal(compound.k, 1);
        });

        it('Compound number single decimal', function () {
            var result = oil.parse('item { value: 1.5k }');
            assert.equal(result.length, 1);
            var item = result[0];
            var compound = item.value["!compound"];
            assert.ok(compound);
            assert.equal(compound.k, 1.5);
        });

        it('Compound number multiple denominations', function () {
            var result = oil.parse('item { value: 1.5 k 20gr 16n }');
            assert.equal(result.length, 1);
            var item = result[0];
            var compound = item.value["!compound"];
            assert.ok(compound);
            assert.equal(compound.k, 1.5);
            assert.equal(compound.gr, 20);
            assert.equal(compound.n, 16);
        });
    });
});