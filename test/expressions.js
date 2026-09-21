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

    describe('Positions', function () {
        it('adds !pos with index, line and character when the detailed option is set', function () {
            var source =
            "states[x ? x.id == \"id1\" -> x]\n" +
            "box {\n" +
            "    a: 1,\n" +
            "    b: \"text\",\n" +
            "    c: [2, 1, 3],\n" +
            "    [\n" +
            "        child()\n" +
            "    ]\n" +
            "}\n" +
            "item {\n" +
            "    value: 1k\n" +
            "}";

            var result = oil.parse(source, {detailed: true}).expressions;
            assert.equal(result.length, 3);

            var sequence = result[0];
            assert.deepEqual(sequence["!pos"], {index: 0, line: 1, character: 1});

            var box = result[1];
            var boxIndex = source.indexOf('box');
            assert.deepEqual(box["!pos"], {index: boxIndex, line: 2, character: 1});

            var child = box["!items"][0];
            var childIndex = source.indexOf('child');
            assert.deepEqual(child["!pos"], {index: childIndex, line: 7, character: 9});

            var item = result[2];
            var itemIndex = source.indexOf('item');
            assert.deepEqual(item["!pos"], {index: itemIndex, line: 10, character: 1});

            var compoundIndex = source.indexOf('1k');
            assert.deepEqual(item.value["!pos"], {
                index: compoundIndex,
                line: 11,
                character: 12
            });
        });
    });

    describe('Ids', function () {
        it('adds a unique incremental !id to objects when the detailed option is set', function () {
            var source = "box { a: 1, [ child() ] }\nitem { b: 2 }";
            var result = oil.parse(source, {detailed: true}).expressions;
            var box = result[0];
            var child = box["!items"][0];
            var item = result[1];

            var ids = [box["!id"], child["!id"], item["!id"]];
            ids.forEach(function (id) {
                assert.equal(typeof id, "number");
            });
            assert.equal(new Set(ids).size, ids.length);
            assert.ok(child["!id"] < item["!id"]);

        });

        it('assigns the same ids every time the same text is parsed', function () {
            var source = "box { a: 1, [ child() ] }\nitem { b: 2 }";
            var collect = function (result) {
                return [result[0]["!id"], result[0]["!items"][0]["!id"], result[1]["!id"]];
            };
            var first = collect(oil.parse(source, {detailed: true}).expressions);
            var second = collect(oil.parse(source, {detailed: true}).expressions);
            assert.deepEqual(first, second);
        });

        it('prefixes !id with the name option', function () {
            var result = oil.parse("box { a: 1 }\nitem { b: 2 }", {detailed: true, name: "file1"}).expressions;
            assert.ok(/^file1:\d+$/.test(result[0]["!id"]));
            assert.ok(/^file1:\d+$/.test(result[1]["!id"]));
            assert.notEqual(result[0]["!id"], result[1]["!id"]);

            var one = oil.parseOne("box { a: 1 }", {detailed: true, name: "n"}).expression;
            assert.ok(/^n:\d+$/.test(one["!id"]));
        });

        it('does not add !id when the detailed option is not set', function () {
            var result = oil.parse("box { a: 1 }");
            assert.equal(result[0]["!id"], undefined);
        });
    });

    describe('Error recovery', function () {
        it('does not recover from errors when the detailed option is not set', function () {
            var result = oil.parse('a + 1; : ; c + 2');
            assert.deepEqual(result, []);
        });

        it('recovers from an invalid top level expression and continues with the next ones', function () {
            var result = oil.parse('a + 1; : ; c + 2', {detailed: true});
            assert.equal(result.expressions.length, 2);
            assert.equal(result.expressions[0].left.identifier, "a");
            assert.equal(result.expressions[1].left.identifier, "c");
            assert.equal(result.errors.length, 1);
            assert.equal(result.errors[0].message, "not a primary expression");
        });

        it('recovers from a missing comma between object fields', function () {
            var result = oil.parse('box { a: [1] b: 2 }', {detailed: true});
            assert.equal(result.expressions.length, 1);
            var box = result.expressions[0];
            assert.equal(box["!type"], "box");
            assert.equal(box.a.length, 1);
            assert.equal(box.a[0], 1);
            assert.equal(box.b, 2);
            assert.equal(result.errors.length, 1);
            assert.equal(result.errors[0].message, "',' expected between fields");
        });

        it('recovers from a missing closing brace of an object', function () {
            var result = oil.parse('box { a: 1, b: 2', {detailed: true});
            assert.equal(result.expressions.length, 1);
            var box = result.expressions[0];
            assert.equal(box["!type"], "box");
            assert.equal(box.a, 1);
            assert.equal(box.b, 2);
            assert.equal(result.errors.length, 1);
            assert.equal(result.errors[0].message, "'}' expected to close object");
        });
    });
});