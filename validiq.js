(function (exports) {
    var validators = {},
        exValidators = {},
        globalSettings = {
            throwErrors: false,
            compiler: "vquery"
        },

        compilers = {
            vjs: vjsCompiler,
            vquery: vqCompiler
        },

        CACHE = {};


    var _slice = Array.prototype.slice;

    function extend (source) {
        var i, k, dict;
        for (i = 1; i < arguments.length; i++) {
            dict = arguments[i];

            if (dict && typeof dict == "object") {
                for (k in dict) {
                    source[k] = dict[k];
                }
            }

        }

        return source;
    }


    /**
     * ValidationError
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


    function addValidator (name, func) {
        validators[name] = func;
        exValidators[name] = function () {
            if (func.apply(this, arguments)) {
                return true;
            } else {
                throw new ValidationError(name, _slice.call(arguments));
            }
        }
    }

    function addValidators (dict) {
        for (var k in dict) {
            addValidator(k, dict[k]);
        }
    }


    function newInstance (options) {
        var compiler,
            instanceSettings = {};

        var instance = function (vquery, throwErrors) {
            if (this instanceof instance) {
                return newInstance(extend({}, instanceSettings, vquery));
            }

            var func;
            if (vquery in CACHE) {
                func = CACHE[vquery];
            } else {
                func = compiler(vquery);
                CACHE[vquery] = func;
            }

            var withValidators = ((typeof throwErrors === "boolean") ? throwErrors : instanceSettings.throwErrors) ? exValidators : validators;

            return function (value) {
                return func(value, value, withValidators);
            };
        }

        instance.ValidationError = ValidationError;
        instance.validators = validators;
        instance.addValidator = addValidator;
        instance.addValidators = addValidators;

        instance.configure = function (options) {
            extend(instanceSettings, options);

            if (!(instanceSettings.compiler in compilers)) {
                instanceSettings.compiler = "vquery";
            }

            compiler = compilers[instanceSettings.compiler];
        }

        instance.configure(options);

        return instance;
    }


    addValidators({
        required: function (val) {
            return val !== false && !!val;
        },

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
    });

    exports.validiQ = newInstance(globalSettings);
}) (window);