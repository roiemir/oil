"use strict";

(function() {
    var OPERATORS = {
        "+": true, "-": true, "*": true, "/": true,
        "%": true,
        "==": true, "!=": true,
        "<": true, ">": true, "<=": true, ">=": true,
        "<<": true, ">>": true,
        "&&": true, "||": true, "!": true,
        "=": true,
        "~": true
    };

    var ESCAPE = { "n": "\n", "f":"\f", "r":"\r", "t":"\t", "v":"\v", "'":"'", '"':'"' };

    var Lexer = function() {};

    Lexer.prototype = {
        constructor: Lexer,

        lex: function(text) {
            this.text = text;
            this.index = 0;
            this.line = 1;
            this.character = 1;
            this.tokens = [];

            // Skipping BOM
            if (text.charCodeAt(0) == 0xFEFF) {
                this.index++;
            }

            this.isEncloseEnabled = true;

            while (this.index < this.text.length) {
                if (this.skipComments()) {
                    continue;
                }
                var encloseEnabled = false;
                var ch = this.text.charAt(this.index);
                if (ch === '"' || ch === "'") {
                    this.readString(ch);
                } else if (ch === '@') {
                    this.readVerbatim();
                } else if (this.isNumber(ch) || ch === '.' && this.isNumber(this.peek())) {
                    this.readNumber();
                } else if (this.isIdentifier(ch)) {
                    this.readIdentifier();
                } else if (ch === '<' && this.isEncloseEnabled) {
                    this.readEnclosedIdentifier();
                } else if (ch === '?') {
                    if (this.peek() === '?') {
                        this.tokens.push({index: this.index, line: this.line, character: this.character, text: "??"});
                        this.index += 2;
                        this.character += 2;
                    }
                    else if (this.peek() === '=') {
                        this.tokens.push({index: this.index, line: this.line, character: this.character, text: "?="});
                        this.index += 2;
                        this.character += 2;
                    }
                    else {
                        this.tokens.push({index: this.index, line: this.line, character: this.character, text: "?"});
                        this.index++;
                        this.character++;
                    }
                    encloseEnabled = true;
                } else if (this.is(ch, '({[.,;:')) {
                    this.tokens.push({index: this.index, line: this.line, character: this.character, text: ch});
                    this.index++;
                    this.character++;
                    encloseEnabled = true;
                } else if (this.is(ch, ')}]')) {
                    this.tokens.push({index: this.index, line: this.line, character: this.character, text: ch});
                    this.index++;
                    this.character++;
                } else if (this.isWhitespace(ch)) {
                    this.index++;
                    if (ch === "\n") {
                        this.character = 1;
                        this.line++;
                    }
                    else {
                        this.character++;
                    }
                    encloseEnabled = this.isEncloseEnabled;
                } else {
                    var ch2 = ch + this.peek();
                    if (ch2 === "->" || ch2 === "=>" || ch2 === "~>") {
                        this.tokens.push({index: this.index, line: this.line, character: this.character, text: ch2});
                        this.index += 2;
                        this.character += 2;
                    }
                    else {
                        //var ch3 = ch2 + this.peek(2);
                        var op1 = OPERATORS[ch];
                        var op2 = OPERATORS[ch2];
                        //var op3 = OPERATORS[ch3];
                        if (op1 || op2/* || op3*/) {
                            var token = /*op3 ? ch3 : */(op2 ? ch2 : ch);
                            this.tokens.push({
                                index: this.index,
                                line: this.line,
                                character: this.character,
                                text: token,
                                operator: true
                            });
                            this.index += token.length;
                            this.character += token.length;
                        } else {
                            this.throwError('Unexpected next character ', this.index, this.index + 1);
                        }
                    }
                    encloseEnabled = true;
                }

                this.isEncloseEnabled = encloseEnabled;
            }
            return this.tokens;
        },

        is: function(ch, chars) {
            return chars.indexOf(ch) !== -1;
        },

        peek: function(i) {
            var num = i || 1;
            return (this.index + num < this.text.length) ? this.text.charAt(this.index + num) : false;
        },

        isNumber: function(ch) {
            return ('0' <= ch && ch <= '9') && typeof ch === "string";
        },

        isWhitespace: function(ch) {
            // IE treats non-breaking space as \u00A0
            return (ch === ' ' || ch === '\r' || ch === '\t' ||
                ch === '\n' || ch === '\v' || ch === '\u00A0');
        },

        isIdentifier: function(ch) {
            return ('a' <= ch && ch <= 'z' ||
                'A' <= ch && ch <= 'Z' ||
                '_' === ch || ch === '$' || ch === '#');
        },

        isExpOperator: function(ch) {
            return (ch === '-' || ch === '+' || this.isNumber(ch));
        },

        throwError: function(error, start, end) {
            end = end || this.index;
            var colStr = (start != null
                ? ' s ' + start +  '-' + end + ' [' + this.text.substring(start, end) + ']'
                : ' ' + end);
            throw {
                message: error + colStr
            };
        },

        skipComments: function () {
            var ch = this.text.charAt(this.index);
            if (ch === '/') {
                var ch2 = this.peek();
                if (ch2 === '*') {
                    this.index += 2;
                    this.character += 2;
                    ch = '';
                    while (this.index < this.text.length) {
                        ch2 = this.text.charAt(this.index++);
                        this.character++;
                        if (ch === '\n') {
                            this.line++;
                            this.character = 1;
                        }
                        else if (ch === '*' && ch2 === '/') {
                            break;
                        }

                        ch = ch2;
                    }
                    return true;
                }
                else if (ch2 === '/') {
                    this.index += 2;
                    this.character += 2;
                    while (this.index < this.text.length) {
                        if (this.text[this.index++] === '\n') {
                            this.character = 1;
                            this.line++;
                            break;
                        }
                        else {
                            this.character++;
                        }
                    }
                    return true;
                }
            }
            return false;
        },

        readNumber: function() {
            var number = '';
            var start = this.index;
            var line = this.line;
            var character = this.character;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index).toLowerCase();
                if (ch == '.' || this.isNumber(ch)) {
                    number += ch;
                } else {
                    var peekCh = this.peek();
                    if (ch == 'e' && this.isExpOperator(peekCh)) {
                        number += ch;
                    } else if (this.isExpOperator(ch) &&
                        peekCh && this.isNumber(peekCh) &&
                        number.charAt(number.length - 1) == 'e') {
                        number += ch;
                    } else if (this.isExpOperator(ch) &&
                        (!peekCh || !this.isNumber(peekCh)) &&
                        number.charAt(number.length - 1) == 'e') {
                        this.throwError('Invalid exponent');
                    } else {
                        break;
                    }
                }
                this.index++;
                this.character++;
            }
            this.tokens.push({
                index: start,
                line: line,
                character: character,
                text: number,
                constant: true,
                value: Number(number)
            });
        },

        readIdentifier: function() {
            var start = this.index;
            var line = this.line;
            var character = this.character;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                if (!(this.isIdentifier(ch) || this.isNumber(ch))) {
                    break;
                }
                this.index++;
                this.character++;
            }
            this.tokens.push({
                index: start,
                line: line,
                character: character,
                text: this.text.slice(start, this.index),
                identifier: true
            });
        },

        readEnclosedIdentifier: function() {
            var line = this.line;
            var character = this.character;
            this.index++;
            var start = this.index;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                if (ch === '>') {
                    break;
                }
                else if (ch == '\n' || ch == '\r') {
                    this.throwError("Illegal character in enclosed identifier");
                }
                this.index++;
                this.character++;
            }
            this.tokens.push({
                index: start,
                line: line,
                character: character,
                text: this.text.slice(start, this.index),
                identifier: true
            });
            this.index++;
        },

        readString: function(quote) {
            var start = this.index;
            var line = this.line;
            var character = this.character;
            this.index++;
            this.character++;
            var string = '';
            var rawString = quote;
            var escape = false;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                rawString += ch;
                if (escape) {
                    if (ch === 'u') {
                        var hex = this.text.substring(this.index + 1, this.index + 5);
                        if (!hex.match(/[\da-f]{4}/i)) {
                            this.throwError('Invalid unicode escape [\\u' + hex + ']');
                        }
                        this.index += 4;
                        this.character += 4;
                        string += String.fromCharCode(parseInt(hex, 16));
                    } else {
                        var rep = ESCAPE[ch];
                        string = string + (rep || ch);
                    }
                    escape = false;
                } else if (ch === '\\') {
                    escape = true;
                } else if (ch === quote) {
                    this.index++;
                    this.character++;
                    this.tokens.push({
                        index: start,
                        line: line,
                        character: character,
                        text: rawString,
                        constant: true,
                        value: string
                    });
                    return;
                } else {
                    string += ch;
                }
                this.index++;
                this.character++;
            }
            this.throwError('Unterminated quote', start);
        },
        readVerbatim: function () {
            var start = this.index;
            var line = this.line;
            var character = this.character;
            var type = "";
            var delimiter = "";
            var atDelimit = false;
            this.index++;
            this.character++;
            var rawString = '@';
            var ch = this.text.charAt(this.index);
            while (this.index < this.text.length) {
                this.index++;
                this.character++;
                rawString += ch;
                if (ch === '"') {
                    delimiter = type + ch;
                    break;
                }
                else if (ch === '[') {
                    type = type.trim();
                    delimiter = ']';
                    atDelimit = true;
                    break;
                }
                else if (ch === '\n') {
                    type = type.trim();
                    delimiter = type;
                    atDelimit = true;
                    break;
                }
                type += ch;
                ch = this.text.charAt(this.index);
            }
            if (this.index === this.text.length) {
                this.throwError('Unset delimiter', start);
            }

            var content = '';

            if (atDelimit) {
                while (this.index < this.text.length) {
                    var ch = this.text.charAt(this.index);
                    if (ch === '\n') {
                        this.line++;
                        this.character = 1;
                    }
                    else {
                        this.character++;
                    }
                    this.index++;
                    rawString += ch;

                    if (ch === '@') {
                        var len = delimiter.length;
                        var i = content.length - 1;

                        if (len > 0) {
                            while (i > 0 && this.isWhitespace(content.charAt(i))) {
                                i--;
                            }
                            while (i >= 0 && len > 0 && content[i] === delimiter[len - 1]) {
                                i--;
                                len--;
                            }
                        }
                        if (len === 0) {
                            content = content.slice(0, i + 1);
                            this.tokens.push({
                                index: start,
                                line: line,
                                character: character,
                                text: rawString,
                                constant: true,
                                value: type.length > 0 ? {
                                    "!type": type,
                                    "!content": content
                                } : content
                            });
                            return;
                        }
                    }
                    content += ch;
                }
            }
            else if (delimiter.length === 1) {
                var quote = false;
                while (this.index < this.text.length) {
                    var ch = this.text.charAt(this.index);
                    if (ch === '\n') {
                        this.line++;
                        this.character = 1;
                    }
                    rawString += ch;
                    if (quote) {
                        if (ch === '"') {
                            content += '"';
                        } else {
                            this.tokens.push({
                                index: start,
                                line: line,
                                character: character,
                                text: rawString,
                                constant: true,
                                value: content
                            });
                            return;
                        }
                        quote = false;
                    } else if (ch === '"') {
                        quote = true;
                    } else {
                        content += ch;
                    }
                    this.index++;
                    this.character++;
                }
            }
            else {
                var d = 0;
                while (this.index < this.text.length) {
                    var ch = this.text.charAt(this.index);
                    if (ch === '\n') {
                        this.line++;
                        this.character = 1;
                    }
                    rawString += ch;
                    this.index++;
                    this.character++;
                    if (ch === delimiter[d]) {
                        d++;
                        if (d === delimiter.length) {
                            this.tokens.push({
                                index: start,
                                line: line,
                                character: character,
                                text: rawString,
                                constant: true,
                                value: content
                            });
                            return;
                        }
                    }
                    else {
                        if (d > 0) {
                            content += delimiter.slice(0, d);
                            d = 0;
                        }
                        content += ch;
                    }
                }
            }
            this.throwError('Unterminated quote', start);
        }
    };

    var Parser = function () {
        this.lexer = new Lexer();
    };

    Parser.prototype = {
        constructor: Parser,
        parseOne: function (source, options, end) {
            var start = 0;
            var detailedResult = false;
            if (options && typeof options === "object") {
                detailedResult = !!options.detailed;
                start = options.start || 0;
                if (end === undefined) {
                    end = options.end;
                }
            }
            else if (typeof options === "number") {
                start = options;
            }

            var endChars = null;
            if (typeof end === "string") {
                endChars = end;
                end = undefined;
            }

            try {
                var expression = null;
                if (source != null) {
                    if (Array.isArray(source)) {
                        this.tokens = source;
                    }
                    else {
                        this.tokens = this.lexer.lex(source.slice(start, end));
                    }
                    this.index = 0;
                    this.character = 1;

                    if (this.tokens.length > 0) {
                        if (!endChars || endChars.indexOf(this.tokens[0].text) < 0) {
                            expression = this.expression();
                        }
                    }
                }
                if (detailedResult) {
                    return {
                        expression: expression,
                        end: this.tokens.length > 0 ? start + this.tokens[0].index : (end || source.length)
                    };
                }
                else {
                    return expression;
                }
            }
            catch (err) {
                console.log(err);
                return null;
            }
        },

        parse: function (source, options, end) {
            var start = 0;
            var detailedResult = false;
            if (options && typeof options === "object") {
                detailedResult = !!options.detailed;
                start = options.start || 0;
                if (end === undefined) {
                    end = options.end;
                }
            }
            else if (typeof options === "number") {
                start = options;
            }

            var endChars = null;
            if (typeof end === "string") {
                endChars = end;
                end = undefined;
            }

            try {
                var expressions = [];
                this.tokens = this.lexer.lex(source.slice(start, end));
                this.index = 0;
                this.rootLevel = true;
                while (this.tokens.length > 0) {
                    if (endChars && endChars.indexOf(this.tokens[0].text) >= 0) {
                        break;
                    }
                    expressions.push(this.expression(true));
                    this.expect(';', ',');
                }
                if (detailedResult) {
                    return {
                        expressions: expressions,
                        end: this.tokens.length > 0 ? start + this.tokens[0].index : (end || source.length)
                    };
                }
                else {
                    return expressions;
                }
            }
            catch (err) {
                console.log(err.message +
                    (err.line != null ? " at line " + err.line : "") +
                    (err.character != null ? " at character " + err.character : ""));
                if (detailedResult) {
                    return {
                        expressions: [],
                        end: start
                    };
                }
                else {
                    return [];
                }
            }
            finally {
                this.rootLevel = false;
            }
        },

        program: function () {
            var body = [];
            while (true) {
                if (this.tokens.length > 0 && !this.peek('}', ')', ';', ']'))
                    body.push(this.expression());
                if (!this.expect(';')) {
                    //return { type: AST.Program, body: body};
                }
            }
        },

        expression: function(first) {
            return this.assignment(first);
        },

        assignment: function(first) {
            var result = this.concat(first);
            if (this.expect('=')) {
                result = {
                    "!exp": "=",
                    left: result,
                    right: this.assignment(true)
                };
            }
            return result;
        },

        concat: function (first) {
            var expression = this.switch(first);
            if (this.expect("=>")) {
                var sequences = [expression];
                do {
                    sequences.push(this.switch());
                } while (this.expect("=>"));
                return {"!exp": "c", "sequences": sequences };
            }
            return expression;
        },

        switch: function(first) {
            var expression = this.conditional(first);
            var value, result;
            var options = [];
            if (this.expect('?=')) {
                var done = false;
                while (!done) {
                    value = this.conditional();
                    if (this.consume(':')) {
                        result = this.conditional();
                        options.push({
                            "value": value,
                            "result": result
                        });
                        done = !this.expect('?=');
                    }
                    else {
                        return expression; // : was expected
                    }
                }
                if (this.consume(':')) {
                    var otherwise = this.conditional();
                    return { "!exp": "?=", expression: expression, options: options, otherwise: otherwise };
                }
            }

            return expression;
        },

        conditional: function(first) {
            var expression = this.logicalOR(first);
            var positive;
            var negative;
            if (this.expect('?')) {
                positive = this.expression();
                if (this.consume(':')) {
                    negative = this.expression();
                    return { "!exp": "?:", expression: expression, positive: positive, negative: negative };
                }
            }
            return expression;
        },

        logicalOR: function(first) {
            var left = this.logicalAND(first);
            while (this.expect('||')) {
                left = { "!exp": "||", left: left, right: this.logicalAND() };
            }
            return left;
        },

        logicalAND: function(first) {
            var left = this.equality(first);
            while (this.expect('&&')) {
                left = { "!exp": "&&", left: left, right: this.equality()};
            }
            return left;
        },

        equality: function(first) {
            var left = this.relational(first);
            var token;
            while ((token = this.expect('==','!='))) {
                left = { "!exp": "b", operator: token.text, left: left, right: this.relational() };
            }
            return left;
        },

        relational: function(first) {
            var left = this.shift(first);
            var token;
            while ((token = this.expect('<', '>', '<=', '>='))) {
                left = { "!exp": "b", operator: token.text, left: left, right: this.shift() };
            }
            return left;
        },

        shift: function (first) {
            var left = this.additive(first);
            var token;
            while ((token = this.expect('<<', '>>'))) {
                left = { "!exp": "b", operator: token.text, left: left, right: this.additive() };
            }
            return left;
        },

        additive: function(first) {
            var left = this.multiplicative(first);
            var token;
            while ((token = this.expect('+','-'))) {
                left = { "!exp": "b", operator: token.text, left: left, right: this.multiplicative() };
            }
            return left;
        },

        multiplicative: function(first) {
            var left = this.nullCoalescing(first);
            var token;
            while ((token = this.expect('*','/','%'))) {
                left = { "!exp": "b", operator: token.text, left: left, right: this.nullCoalescing() };
            }
            return left;
        },

        nullCoalescing: function (first) {
            var left = this.unary(first);
            var token;
            while ((token = this.expect('??'))) {
                left = { "!exp": "??", left: left, right: this.nullCoalescing() };
            }
            return left;
        },

        unary: function(first) {
            var token;
            if ((token = this.expect('+', '-', '!'))) {
                return { "!exp": "u", operator: token.text, argument: this.unary() };
            } else {
                return this.primary(first);
            }
        },

        primary: function(first) {
            var primary;
            if (this.expect('(')) {
                primary = this.expression(true);
                this.consume(')');
            } else if (this.expect('[')) {
                primary = [];
                this.items(primary);
            } else if (this.peek('{')) {
                var primary = {};
                this.fillObject(primary);
            } else if (this.constants.hasOwnProperty(this.peek().text)) {
                primary = this.constants[this.consume().text]();
            } else if (this.peek().identifier) {
                primary = this.identifier();

                if (first && this.expect("->")) {
                    // This is a select expression
                    var selection = this.expression();
                    primary = {"!exp": "->", key: primary.identifier, selection: selection};
                }
                else {
                    var next = this.peek();
                    if (next) {
                        if (next.constant) {
                            primary = {"!ref": primary.identifier, "!value": this.constant()};
                        }
                        else {
                            var ref = null;
                            if (next.identifier) {
                                ref = primary;
                                primary = this.identifier();
                            }

                            if (ref || this.peek("{", "(")) {
                                primary = this.object(primary.identifier, ref ? ref.identifier : null);
                            }
                        }
                    }
                }
            } else if (this.peek().constant) {
                primary = this.constant();
            } else {
                this.throwError('not a primary expression', this.peek());
            }

            var next;
            while ((next = this.expect('[', '.'))) {
                if (next.text === '[') {
                    primary = this.selector(primary);
                    this.consume("]");
                } else if (next.text === '.') {
                    primary = { "!exp": "f", object: primary, field: this.identifier().identifier };
                } else {
                    this.throwError('IMPOSSIBLE');
                }
            }

            return primary;
        },

        selector: function (sequence) {
            var key;
            if (this.expect(":")) {
                var end = this.peek().text == ']' ? null : this.expression();
                return {"!exp": "@:", start: null, end: end, sequence: sequence };
            }

            if (this.tokens.length > 2 && this.tokens[0].identifier) {
                var op = this.tokens[1].text;
                if (op === "?" || op === "->" || op === "=>" || op === "~>" || op === "~") {
                    key = this.identifier();
                    this.consume();

                    var condition;
                    var order;
                    // If ? it might be a regular conditional
                    if (op === "?") {
                        condition = this.switch(); // skipping concat
                        if (this.expect(":")) {
                            var negative = this.expression();
                            key = {"!exp": "?:", expression: key, positive: condition, negative: negative};
                            op = null;
                            // this is just a conditional so it would be used as a key
                        }
                        else if (op = this.expect("->", "=>", "~>", "~")) {
                            op = op.text;
                        }
                        else {
                            return {"!exp": "s", sequence: sequence, key: key.identifier, condition: condition };
                        }
                    }

                    if (op === "~") {
                        order = this.switch();
                        if (op = this.expect("->", "=>", "~>")) {
                            op = op.text;
                        }
                        else {
                            return {"!exp": "s", sequence: sequence, key: key.identifier, order: order };
                        }
                    }

                    if (op) {
                        var selection = this.expression();
                        var result = {"!exp": "s", sequence: sequence, key: key.identifier, selection: selection };
                        if (condition) {
                            result.condition = condition;
                        }
                        if (order) {
                            result.order = order;
                        }
                        if (op === "=>") {
                            result.concat = true;
                        }
                        else if (op === "~>") {
                            result.traverse = true;
                        }
                        return result;
                    }
                }
            }

            key = this.expression();

            if (this.expect(":")) {
                var end = this.peek().text == ']' ? null : this.expression();
                return {"!exp": "@:", start: key, end: end, sequence: sequence };
            }

            return {"!exp": "@", key: key, sequence: sequence };
        },

        items: function (items) {
            if (!this.expect("]")) {
                do {
                    items.push(this.expression(true));
                } while (this.expect(","));

                if (!this.expect("]")) {
                    this.throwError("items list close missing", this.peek());
                }
            }
        },

        fillObject: function (object) {

            var rootLevel = this.rootLevel;
            this.rootLevel = false;

            var items = [];

            if (this.expect("(")) {
                if (!this.expect(")")) {
                    var init = [];
                    do {
                        init.push(this.expression(true));
                    } while (this.expect(","));
                    if (!this.expect(")")) {
                        this.throwError('object initializer close missing', this.peek());
                    }
                    object["!init"] = init;
                }
            }

            if (this.expect("{")) {
                var closed = false;
                do {
                    if (this.expect("[")) {
                        this.items(items)
                    }
                    else {
                        var field = this.consume();
                        if (field.text === "}") {
                            closed = true;
                            break;
                        }
                        if (!field.identifier) {
                            this.throwError('is not a valid field', field);
                        }
                        if (this.expect(":")) {
                            object[field.text] = this.expression(true);
                        }
                        /*else if (this.peek("{", "(")) {
                            var fieldObject = {};
                            this.fillObject(fieldObject);
                            object[field.text] = fieldObject;
                        }*/
                        else {
                            this.throwError('field was not supplied', field);
                        }
                    }
                } while (this.expect(","));
                if (!closed && !this.expect("}")) {
                    this.throwError('object close missing', this.peek());
                }
            }

            this.rootLevel = rootLevel;

            if (items.length === 0 && !this.rootLevel) {
                var next = this.peek();
                if (next && next.identifier) {
                    var nested = this.primary();
                    if (nested) {
                        items.push(nested);
                    }
                }
            }

            if (items.length > 0) {
                object["!items"] = items;
            }
        },

        object: function (type, ref) {
            var object = {"!type": type};
            if (ref) {
                object["!ref"] = ref;
            }
            this.fillObject(object);

            return object;
        },

        identifier: function() {
            var token = this.consume();
            if (!token.identifier) {
                this.throwError('is not a valid identifier', token);
            }
            return { "!exp": "i", "identifier": token.text };
        },

        constant: function() {
            var result = this.consume().value;
            if (!this.rootLevel && this.peek().identifier) {
                var compound = {};
                var denom = this.consume();
                compound[denom.text] = result;
                while (this.peek().constant) {
                    result = this.consume().value;
                    if (this.peek().identifier) {
                        denom = this.consume();
                        compound[denom.text] = result;
                    }
                    else {
                        compound[""] = result;
                    }
                }
                result = {"!compound": compound};
            }
            return result;
        },

        throwError: function(msg, token) {
            /*throw $parseMinErr('syntax',
             'Syntax Error: Token \'{0}\' {1} at column {2} of the expression [{3}] starting at [{4}].',
             token.text, msg, (token.index + 1), this.text, this.text.substring(token.index));*/
            throw {
                message: msg,
                line: token ? token.line : null,
                character: token ? token.character : null
            };
        },

        consume: function(e1) {
            if (this.tokens.length === 0) {
                //throw $parseMinErr('ueoe', 'Unexpected end of expression: {0}', this.text);
                throw "error";
            }

            var token = this.expect(e1);
            if (!token) {
                this.throwError('is unexpected, expecting [' + e1 + ']', this.peek());
            }
            return token;
        },

        peekToken: function() {
            if (this.tokens.length === 0) {
                return null;
            }
            return this.tokens[0];
        },

        peek: function(e1, e2, e3, e4) {
            return this.peekAhead(0, e1, e2, e3, e4);
        },

        peekAhead: function(i, e1, e2, e3, e4) {
            if (this.tokens.length > i) {
                var token = this.tokens[i];
                var t = token.text;
                if (t === e1 || t === e2 || t === e3 || t === e4 ||
                    (!e1 && !e2 && !e3 && !e4)) {
                    return token;
                }
            }
            return false;
        },

        expect: function(e1, e2, e3, e4) {
            var token = this.peek(e1, e2, e3, e4);
            if (token) {
                this.tokens.shift();
                return token;
            }
            return false;
        },

        constants: {
            'true': function () { return true; },
            'false': function () { return false; },
            'null': function () { return null; }
        }
    };

    var parser = new Parser();

    var oil = {
        parse: function (source, options, end) {
            return parser.parse(source, options, end);
        },
        parseOne: function (source, options, end) {
            return parser.parseOne(source, options, end);
        },
        lex: function (source) {
            return parser.lexer.lex(source);
        }
    };

    if( typeof exports !== 'undefined' ) {
        if( typeof module !== 'undefined' && module.exports ) {
            exports = module.exports = oil
        }
        exports.oil = oil
    }
    else {
        this.oil = oil
    }
}).call(this);
