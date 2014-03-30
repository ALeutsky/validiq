(function () {
    var validiQ = function (vquery) {
        var func = vqCompiler(vquery);

        return function (value) {
            return func(value, value,  validators);
        };
    };

    var _slice = Array.prototype.slice;

    var validators = {
        /**
         * @param val
         * @return {boolean}
         */
        required: function (val) {
            return val !== false && !!val;
        },

        /**
         * @param val
         * @return {boolean}
         */
        blank: function (val) {
            return !val;
        },

        min: function (val, lvl) {
            return val >= lvl;
        },

        max: function (val, lvl) {
            return val <= lvl;
        },

        minlen: function (val, len) {
            return val.length >= len;
        },

        maxlen: function (val, len) {
            return val.length <= len;
        },

        /**
        int: function (val) {
            return /^(-|)\d+$/.test(val);
        },

        uint: function (val) {
            return /^\d+$/.test(val);
        },
        */

        number: function (val) {
            return !isNaN(val * 1);
        },

        string: function (val) {
            return typeof val == "string";
        },

        email: function (val) {
            // TODO: email validator
            return /^[a-z0-9-.]+@[a-z0-9-.]+\.[a-z]{2,10}$/i.test(val);
        }
    };


    /**
     *
     * @param name
     * @param args
     * @constructor
     */
    function ValidationError (name, args) {
        this.name = name;
        this.args = args;
    }
    ValidationError.prototype = new Error();

    ValidationError.prototype.toString = function () {
        return this.name;
    }

    validiQ.ValidationError = ValidationError;


    var exValidators = {},
        name;
    for (name in validators) {
        addExValidator(name, validators[name]);
    }

    function addExValidator (name, func) {
        exValidators[name] = function () {
            if (func.apply(this, arguments)) {
                return true;
            } else {
                throw new ValidationError(name, _slice.call(arguments));
            }
        }
    }

    function vjsCompiler (vjs) {
        if (vjs == "") {
            vjs = "true";
        }
        return new Function("value", "val", "validators", "with (validators) {return " + vjs + "}");
    }

    function vqCompiler (vquery) {
        vquery = vquery.replace(/\s+/g, "");

        var vjs = "",
            res, word, args, i,
            lastPos = 0,
            re = /[A-Za-z$_][A-Za-z0-9$_]*/g;

        while (res = re.exec(vquery)) {
            word = res[0];

            vjs += vquery.substr(lastPos, res.index - lastPos) + word;

            if (vquery.charAt(re.lastIndex) == "(") {
                lastPos = vquery.indexOf(")", re.lastIndex);

                args = vquery.slice(re.lastIndex + 1, lastPos).split(",");
                args.unshift("val");

                for (i = 1; i < args.length; i++) {
                    if (args[i] == "val" || args[i] == "value") {
                        args.shift();
                        break;
                    }
                }
                args = args.join(",");

                re.lastIndex = lastPos;
            } else {
                args = "val";
                lastPos = re.lastIndex;
            }

            vjs += "(" + args + ")";
        }

        return vjsCompiler(vjs);
    }


    validiQ.is = validators;

    validiQ.addValidator = function (name, func) {
        validators[name] = func;
        addExValidator(name, func);
    }

    window.validiQ = validiQ;
}) ();