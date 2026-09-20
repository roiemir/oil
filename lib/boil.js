"use strict";

var oil = require('./oil.js');

(function() {

    const GLOBAL = 0x00;
    const OBJECT = 0x01;
    const REF = 0x02;
    const TYPE = 0x03;
    const FIELD = 0x04;
    const ITEMS = 0x05;
    const NULL = 0xFF;

    // Either we do something like close object instead of items length ?
    // Or we compress info e.g. object ref and type existing ?

    function BoilWriter() {
        this.buffer = Buffer.allocUnsafe(1);
        this.index = 0;
    }

    BoilWriter.prototype.toBuffer = function() {
        return this.buffer.slice(0, this.index);
    };

    BoilWriter.prototype.ensure = function (size) {
        if (this.index + size > this.buffer.length) {
            var buffer = Buffer.allocUnsafe(this.buffer.length + Math.max(size, Math.min(this.buffer.length, 1024)));
            this.buffer.copy(buffer);
            this.buffer = buffer;
        }
    };

    BoilWriter.prototype.writeByte = function (byte) {
        this.ensure(1);
        this.buffer[this.index++] = byte;
    };

    BoilWriter.prototype.writeGlobal = function(val) {
        this.writeByte(GLOBAL);
        this.writeValue(val);
    };

    BoilWriter.prototype.writeLength = function (len) {
        if (len < 128) {
            this.writeByte(len);
        }
    };

    BoilWriter.prototype.writeString = function(str) {
        var buf = new Buffer(str, "utf8");
        this.writeLength(buf.length);
        if (buf.length > 0) {
            this.ensure(buf.length);
            buf.copy(this.buffer, this.index);
            this.index += buf.length;
        }
    };

    BoilWriter.prototype.writeValue = function (val) {
        if (val == null) {
            this.writeByte(NULL);
        }
        else if (typeof val === "object") {
            this.writeByte(OBJECT);
            var t = val["!ref"];
            if (t) {
                this.writeByte(REF);
                this.writeString(t);
            }
            t = val["!type"];
            if (t) {
                this.writeByte(TYPE);
                this.writeString(t);
            }
            for (var key in val) {
                if (key[0] !== "!") {
                    this.writeByte(FIELD);
                    this.writeString(key);
                    this.writeValue(val[key]);
                }
            }
            var items = val["!items"];
            if (items) {
                this.writeByte(ITEMS);
                this.writeLength(items.length);
                for (var n = 0; n < items.length; n++) {
                    this.writeValue(items[n]);
                }
            }
        }
        else if (typeof val === "string") {

        }
        else if (typeof val === "number") {

        }
    };


    var boil = {
        parse: function (source) {
            var data = oil.parse(source);
            var writer = new BoilWriter();
            for (var n = 0; n < data.length; n++) {
                writer.writeGlobal(data[n]);
            }
            return writer.toBuffer();
        }
    };

    if( typeof exports !== 'undefined' ) {
        if( typeof module !== 'undefined' && module.exports ) {
            exports = module.exports = boil
        }
        exports.boil = boil
    }
    else {
        this.boil = boil
    }
}).call(this);
