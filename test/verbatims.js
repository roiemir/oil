var assert = require('assert');
var oil = require('../lib/oil.js');

describe('Verbatims', function () {
    it('Simple', function () {
        var result = oil.parse('@/" some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   /"');
        assert.equal(result.length, 1);
        assert.equal(result[0], " some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   ");
    });

    it('Long delimiter', function () {
        var result = oil.parse('@some long delimiter" some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   some long delimiter"');
        assert.equal(result.length, 1);
        assert.equal(result[0], " some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   ");
    });

    it('Block delimiter', function () {
        var result = oil.parse('@[ some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   ]  @');
        assert.equal(result.length, 1);
        assert.equal(result[0], " some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   ");
    });

    it('Block delimiter with type', function () {
        var result = oil.parse('@ contentType  [ some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   ]  @');
        assert.equal(result.length, 1);
        assert.equal(result[0]["!type"], "contentType");
        assert.equal(result[0]["!content"], " some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   ");
    });

    it('Line end delimiter', function () {
        var result = oil.parse('@  \n some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   @');
        assert.equal(result.length, 1);
        assert.equal(result[0], " some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   ");
    });

    it('Content type delimiter', function () {
        var result = oil.parse('@ contentType \n some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   contentType  @');
        assert.equal(result.length, 1);
        assert.equal(result[0]["!type"], "contentType");
        assert.equal(result[0]["!content"], " some long text \n seperated by lines \n with oil like objects (test) { a: b } index \n   ");
    });
});