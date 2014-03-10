/*
required -> required(val)
blank || email -> blank(val) || email(val)

fn -> fn(val)
fn(1,2) -> fn(val, 1, 2)

fn(1,value) -> fn(1,value)

$vq(a).is("email")
$vq(a).check("email")

 */


(function () {
    var vQ;

    var validators = {
        /**
         * @param value
         * @return {boolean}
         */
        required: function (value) {
            return value !== false && !!value;
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
                throw name;
            }
        }
    }

    function vjsCompiler (vjs) {
        return new Function("value", "val", "validators", "with (validators) {return " + vjs + "}");
    }

    function vqCompiler (vquery) {

    }

    vQ = function (vquery) {
        var func = vjsCompiler(vquery);

        return function (value) {
            return func(value, value, exValidators);
        };
    };

    vQ.addValidator = function (name, func) {
        validators[name] = func;
        addExValidator(name, func);
    }

    window.validiQ = window.vQ = vQ;
}) ();