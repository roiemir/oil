var test = require('node:test');
var assert = require('node:assert');
var boil = require('../lib/boil.js');

test('Text to binary', function () {
    var result = boil.parse(
        'ref box { ' +
        '  none: null, ' +
        '  num: 100, ' +
        '  text: "my text", ' +
        '  [ ' +
        '     box { ' +
        '       exp: f + t.n * first(arr[x ? x.val < 10 -> x.val]) ' +
        '     } ' +
        '  ]' +
        '}');

    var line = "";
    for (var n = 0; n < result.length; n++) {
        line += ("0" + result[n].toString(16)).slice(-2) + " ";
        if (line.length >= 48) {
            console.log(line);
            line = "";
        }
    }
    if (line.length > 0) {
        console.log(line);
    }
});