Array.prototype.peek = function () {
    return this.length === 0 ? undefined : this[this.length - 1];
};
Array.prototype.collect = function (fn) {
    var res = [];
    for (var i = 0; i < this.length; ++i) {
        var tmp = fn(this[i]);
        for (var j = 0; j < tmp.length; ++j) {
            res.push(tmp[j]);
        }
    }
    return res;
};
Array.prototype.pushRange = function (other) {
    for (var i = 0; i < other.length; ++i) {
        this.push(other[i]);
    }
};
Array.prototype.max = function () {
    return Math.max.apply(null, this);
};
Array.prototype.min = function () {
    return Math.min.apply(null, this);
};
Array.prototype.spliceArray = function (start, deleteCount, array) {
    return Array.prototype.splice.apply(this, [start, deleteCount].concat(array));
};
Array.prototype.clear = function () {
    return this.splice(0, this.length);
};
var Assertion = (function () {
    function Assertion() {
    }
    Assertion.check = function (cond, msg) {
        if (msg === void 0) { msg = ""; }
        try {
            if (!cond)
                throw Error("check failed: " + msg);
        }
        catch (e) {
        }
        return cond;
    };
    Assertion.assert = function (cond, msg) {
        if (msg === void 0) { msg = ""; }
        if (!cond)
            throw Error("assertion failed: " + msg);
    };
    Assertion.assertCode = function (cond) {
        if (!cond) {
            var e = Error("assertion failed");
            e.includeSource = true;
            throw e;
        }
    };
    Assertion.die = function () {
        throw Error("OOPS");
    };
    Assertion.oops = function (msg, attachments) {
        if (attachments === void 0) { attachments = null; }
        var err = new Error("OOPS: " + msg);
        if (attachments)
            err.bugAttachments = attachments;
        throw err;
    };
    return Assertion;
})();
var Exception = (function () {
    function Exception(message) {
        if (message === void 0) { message = null; }
        this.message = "";
        this.callStack = "";
        this.callStackWithArguments = "";
        if (message != null) {
            this.message = message;
        }
        this.callStack = this.getStackTrace().join("\n");
        this.callStackWithArguments = this.getStackTraceWithArguments().join("\n");
    }
    Exception.prototype.toString = function () {
        return this.message + "\n" + this.callStack + "\n" + this.callStackWithArguments;
    };
    Exception.prototype.getStackTrace = function () {
        var callstack = [];
        var isCallstackPopulated = false;
        try {
            var we;
            we.dont.exist += 0;
        }
        catch (e) {
            var w = window;
            if (e.stack) {
                var lines = e.stack.split('\n');
                for (var i = 0, len = lines.length; i < len; i++) {
                    if (lines[i].match(/^\s*at/)) {
                        callstack.push(lines[i]);
                    }
                }
                callstack.shift();
                callstack.shift();
                isCallstackPopulated = true;
            }
            else if (w.opera && e.message) {
                var lines = e.message.split('\n');
                for (var i = 0, len = lines.length; i < len; i++) {
                    if (lines[i].match(/^\s*[A-Za-z0-9\s\-_\$]+\(/)) {
                        var entry = lines[i];
                        if (lines[i + 1]) {
                            entry += ' at ' + lines[i + 1];
                            i++;
                        }
                        callstack.push(entry);
                    }
                }
                callstack.shift();
                isCallstackPopulated = true;
            }
        }
        if (!isCallstackPopulated) {
            var currentFunction = arguments.callee.caller;
            var currentDepth = 0;
            var maxDepth = 100;
            while (currentFunction && (currentDepth < maxDepth)) {
                var fn = currentFunction.toString();
                var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('{')) || 'anonymous';
                callstack.push(fname);
                currentFunction = currentFunction.caller;
                currentDepth++;
            }
            callstack.shift();
        }
        return callstack;
    };
    Exception.prototype.getStackTraceWithArguments = function () {
        var callstack = [];
        var isCallstackPopulated = false;
        try {
            var currentFunction = arguments.callee.caller;
            var currentDepth = 0;
            var maxDepth = 100;
            while (currentFunction && (currentDepth < maxDepth)) {
                var fn = currentFunction.toString();
                var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('{')) || 'anonymous';
                var args = currentFunction.arguments.length + ' args [';
                for (var i = 0; i < currentFunction.arguments.length; i++) {
                    var arg = currentFunction.arguments[i];
                    var argString;
                    if (typeof arg === "string") {
                        argString = arg.length > 30 ? arg.substr(0, 30) + "..." : arg;
                    }
                    else if (typeof arg === "number") {
                        argString = arg.toString();
                    }
                    else if (typeof arg === "boolean") {
                        argString = arg.toString();
                    }
                    else {
                        argString = "(" + (typeof arg) + ")";
                    }
                    args += i + '=' + argString + ' ';
                }
                args += ']';
                callstack.push(fname + " " + args);
                currentFunction = currentFunction.caller;
                currentDepth++;
            }
            callstack.shift();
        }
        catch (e) {
            callstack = [e.toString()];
        }
        return callstack;
    };
    return Exception;
})();
var DateInternalsForToStringWithFormat = (function () {
    function DateInternalsForToStringWithFormat() {
    }
    DateInternalsForToStringWithFormat.token = /DD|MM|YYYY|HH|mm|ss(?:s)?|Z|"[^"]*"|'[^']*'/g;
    DateInternalsForToStringWithFormat.timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
    DateInternalsForToStringWithFormat.timezoneClip = /[^-+\dA-Z]/g;
    DateInternalsForToStringWithFormat.pad = function (val, len) {
        if (len === void 0) { len = 2; }
        val = String(val);
        while (val.length < len)
            val = "0" + val;
        return val;
    };
    return DateInternalsForToStringWithFormat;
})();
Date.prototype.isEmpty = function () {
    return (this.getTime() === 0);
};
Date.prototype.toStringWithFormat = function (format, utc) {
    var _ = utc ? "getUTC" : "get", d = this[_ + "Date"](), D = this[_ + "Day"](), M = this[_ + "Month"](), y = this[_ + "FullYear"](), H = this[_ + "Hours"](), m = this[_ + "Minutes"](), s = this[_ + "Seconds"](), L = this[_ + "Milliseconds"](), o = utc ? 0 : this.getTimezoneOffset(), flags = {
        DD: DateInternalsForToStringWithFormat.pad(d),
        MM: DateInternalsForToStringWithFormat.pad(M + 1),
        YYYY: y,
        h: H % 12 || 12,
        HH: DateInternalsForToStringWithFormat.pad(H),
        mm: DateInternalsForToStringWithFormat.pad(m),
        ss: DateInternalsForToStringWithFormat.pad(s),
        sss: DateInternalsForToStringWithFormat.pad(L, 3),
        Z: utc ? "UTC" : (String(this).match(DateInternalsForToStringWithFormat.timezone) || [""]).pop().replace(DateInternalsForToStringWithFormat.timezoneClip, ""),
    };
    return format.replace(DateInternalsForToStringWithFormat.token, function ($0) {
        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
};
Date.empty = new Date(0);
Date.isNullOrEmpty = function (date) {
    return (date === undefined) || (date === null) || (date.getTime() === 0);
};
var Guid = (function () {
    function Guid(s) {
        if (s === undefined) {
            this._data = Guid._emptyGuidString;
        }
        else if (s === null) {
            throw new Exception("Cannot initialize Guid object with a null string");
        }
        else {
            s = s.replace(/\{|\(|\)|\}|-/g, "");
            s = s.toLowerCase();
            if (s.length !== 32 || s.search(/[^0-9,a-f]/i) !== -1) {
                throw new Exception("Invalid format of Guid " + s);
            }
            else {
                this._data = s;
            }
        }
    }
    Guid.generateHex = function () {
        var hex = [];
        for (var n = 0; n < 256; n++) {
            hex[n] = (n < 16 ? "0" : "") + n.toString(16);
        }
        return hex;
    };
    Guid.prototype.equals = function (g) {
        if ((g === undefined) || (g === null)) {
            return false;
        }
        return (this.toString() === g.toString());
    };
    Guid.parse = function (s) {
        return new Guid(s);
    };
    Guid.prototype.isEmpty = function () {
        return (this._data === Guid._emptyGuidString);
    };
    Guid.prototype.toString = function () {
        return this.toStringWithFormat("N");
    };
    Guid.prototype.toStringWithFormat = function (format) {
        if (format === void 0) { format = "N"; }
        switch (format) {
            case "N":
                return this._data;
            case "D":
                var s = this._data;
                s = s.substring(0, 8) + "-" + s.substring(8, 12) + "-" + s.substring(12, 16) + "-" + s.substring(16, 20) + "-" + s.substring(20, 32);
                return s;
            default:
                throw new Exception("Unknown Guid format: " + format);
        }
    };
    Guid.newGuid = function () {
        var t = Guid._hex;
        var e = Math.random() * 4294967295 | 0;
        var n = Math.random() * 4294967295 | 0;
        var r = Math.random() * 4294967295 | 0;
        var i = Math.random() * 4294967295 | 0;
        var s = t[e & 255] + t[e >> 8 & 255] + t[e >> 16 & 255] + t[e >> 24 & 255] + t[n & 255] + t[n >> 8 & 255] + t[n >> 16 & 15 | 64] + t[n >> 24 & 255] + t[r & 63 | 128] + t[r >> 8 & 255] + t[r >> 16 & 255] + t[r >> 24 & 255] + t[i & 255] + t[i >> 8 & 255] + t[i >> 16 & 255] + t[i >> 24 & 255];
        var g = new Guid();
        g._data = s;
        return g;
    };
    Guid._emptyGuidString = "00000000000000000000000000000000";
    Guid.empty = new Guid();
    Guid._hex = Guid.generateHex();
    return Guid;
})();
var GuidMap = (function () {
    function GuidMap() {
        this.items = {};
        this.length = 0;
    }
    GuidMap.fromArray = function (array, keySelector) {
        var map = new GuidMap();
        array.forEach(function (v) {
            map.items[keySelector(v).toStringWithFormat("N")] = v;
        });
        map.length = array.length;
        return map;
    };
    GuidMap.prototype.count = function () {
        return this.length;
    };
    GuidMap.prototype.keys = function () {
        var keys = [];
        for (var stringKey in this.items) {
            keys.push(new Guid(stringKey));
        }
        return keys;
    };
    GuidMap.prototype.values = function () {
        var values = [];
        for (var stringKey in this.items) {
            values.push(this.items[stringKey]);
        }
        return values;
    };
    GuidMap.prototype.forEachValue = function (callbackfn) {
        for (var stringKey in this.items) {
            if (callbackfn(this.items[stringKey])) {
                break;
            }
        }
    };
    GuidMap.prototype.at = function (key) {
        var result = this.items[key.toStringWithFormat("N")];
        return (result);
    };
    GuidMap.prototype.set = function (key, value) {
        var stringKey = key.toStringWithFormat("N");
        var val = this.items[stringKey];
        if (val != value) {
            if (val != null) {
                this.length--;
                delete this.items[stringKey];
            }
            if (value != null) {
                this.items[stringKey] = value;
                this.length++;
            }
        }
    };
    GuidMap.prototype.clear = function () {
        this.items = {};
        this.length = 0;
    };
    GuidMap.prototype.setMany = function (guidMap) {
        var _this = this;
        var stringKeys = Object.keys(guidMap.items);
        stringKeys.forEach(function (stringKey) {
            var value = guidMap.items[stringKey];
            _this.items[stringKey] = value;
            _this.length++;
        });
    };
    GuidMap.prototype.remove = function (key) {
        var val = this.items[key];
        if (val != null) {
            this.length--;
            delete this.items[key];
            return val;
        }
        return null;
    };
    GuidMap.prototype.toString = function () {
        var _this = this;
        var s = "{" + Object.keys(this.items).map(function (key) { return key + "->" + _this.items[key]; }).join(",") + "}";
        return s;
    };
    return GuidMap;
})();
var JsonWriter = (function () {
    function JsonWriter() {
        this._queue = [];
        this._current = null;
        this._cachedName = null;
    }
    JsonWriter.prototype.toString = function () {
        if (this._queue.length > 0) {
            throw new Exception("The json has not been completed. _queue.length is " + this._queue.length);
        }
        return JSON.stringify(this._root);
    };
    JsonWriter.prototype.writeName = function (name) {
        if (!String.isNullOrEmpty(this._cachedName)) {
            throw new Exception("_cachedName has been assigned a value(" + this._cachedName + ").");
        }
        this._cachedName = name;
    };
    JsonWriter.prototype.writeValue = function (value) {
        if (String.isNullOrEmpty(this._cachedName)) {
            throw new Exception("Need to writeName() first.");
        }
        this._current[this._cachedName] = JsonWriter.serializeValue(value);
        this._cachedName = null;
    };
    JsonWriter.prototype.write = function (name, value) {
        this._current[name] = JsonWriter.serializeValue(value);
    };
    JsonWriter.serializeValue = function (value) {
        if (typeof value === "object") {
            if (value instanceof Date) {
                if (value.getMilliseconds() !== 0) {
                    value = value.toStringWithFormat("YYYY-MM-DD HH:mm:ss.sss");
                }
                else {
                    value = value.toStringWithFormat("YYYY-MM-DD HH:mm:ss");
                }
            }
            else if (value instanceof Guid) {
                value = value.toStringWithFormat("N");
            }
        }
        return value;
    };
    JsonWriter.prototype.writeStartObject = function () {
        var o = {};
        if (this._isArray) {
            this._current.push(o);
        }
        else {
            if (!String.isNullOrEmpty(this._cachedName)) {
                this._current[this._cachedName] = o;
                this._cachedName = null;
            }
        }
        this._queue.push(o);
        this._current = this._queue.peek();
        this._isArray = false;
    };
    JsonWriter.prototype.writeEndObject = function () {
        this._root = this._queue.pop();
        this._current = this._queue.peek();
        this._isArray = this._current instanceof Array;
    };
    JsonWriter.prototype.writeStartArray = function () {
        var a = [];
        if (this._isArray) {
            this._current.push(a);
        }
        else {
            if (!String.isNullOrEmpty(this._cachedName)) {
                this._current[this._cachedName] = a;
                this._cachedName = null;
            }
        }
        this._queue.push(a);
        this._current = this._queue.peek();
        this._isArray = true;
    };
    JsonWriter.prototype.writeEndArray = function () {
        this._root = this._queue.pop();
        this._current = this._queue.peek();
        this._isArray = this._current instanceof Array;
    };
    return JsonWriter;
})();
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warning"] = 2] = "Warning";
    LogLevel[LogLevel["Error"] = 3] = "Error";
})(LogLevel || (LogLevel = {}));
var CommonInternals;
(function (CommonInternals) {
    var Log = (function () {
        function Log(level, area, message, exception) {
            this.level = level;
            this.area = area;
            this.message = message;
            this.exception = exception;
        }
        return Log;
    })();
    CommonInternals.Log = Log;
})(CommonInternals || (CommonInternals = {}));
var MemoryLogger = (function () {
    function MemoryLogger() {
        this._logs = [];
    }
    MemoryLogger.prototype.Log = function (level, area, message, exception) {
        var console = console || undefined;
        if (console || console !== undefined) {
            if (level === 0 /* Debug */) {
                console.info(area + " " + message + " " + (exception !== null ? exception.toString() : ""));
            }
            else if (level === 1 /* Info */) {
                console.info(area + " " + message + " " + (exception !== null ? exception.toString() : ""));
            }
            else if (level === 2 /* Warning */) {
                console.warn(area + " " + message + " " + (exception !== null ? exception.toString() : ""));
            }
            else if (level === 3 /* Error */) {
                console.error(area + " " + message + " " + (exception !== null ? exception.toString() : ""));
            }
            this._logs.push(new CommonInternals.Log(level, area, message, exception));
        }
    };
    MemoryLogger.prototype.Dump = function () {
        var s = "";
        for (var i = this._logs.length - 1; i >= 0; i--) {
            var log = this._logs[i];
            s = log.level + log.area + log.message + (log.exception !== null ? log.exception.toString() : "");
            s += "\r\n";
        }
        return s;
    };
    return MemoryLogger;
})();
var Logger = (function () {
    function Logger() {
    }
    Logger.SetLogger = function (logger) {
        Logger._logger = logger;
    };
    Logger.Dump = function () {
        return Logger._logger.Dump();
    };
    Logger.Debug = function (area, message) {
        Logger._logger.Log(0 /* Debug */, area, message, null);
    };
    Logger.Info = function (area, message) {
        Logger._logger.Log(1 /* Info */, area, message, null);
    };
    Logger.Warning = function (area, message, exception) {
        if (exception === void 0) { exception = null; }
        Logger._logger.Log(2 /* Warning */, area, message, exception);
    };
    Logger.Error = function (area, message, exception) {
        if (exception === void 0) { exception = null; }
        Logger._logger.Log(3 /* Error */, area, message, exception);
    };
    Logger._logger = new MemoryLogger();
    return Logger;
})();
Object.flatClone = function (obj) {
    var r = {};
    Object.keys(obj).forEach(function (k) {
        r[k] = obj[k];
    });
    return r;
};
Object.jsonClone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};
Object.clone = function (obj) {
    var r = new obj.constructor;
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            r[k] = obj[k];
        }
    }
    return r;
};
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var PromiseState;
(function (PromiseState) {
    PromiseState[PromiseState["Pending"] = 0] = "Pending";
    PromiseState[PromiseState["Success"] = 1] = "Success";
    PromiseState[PromiseState["Error"] = 2] = "Error";
})(PromiseState || (PromiseState = {}));
var Promise = (function () {
    function Promise(init, _onNotify) {
        if (_onNotify === void 0) { _onNotify = undefined; }
        this._onNotify = _onNotify;
        this._listeners = [];
        this._state = 0 /* Pending */;
        if (!!init) {
            var promise = this;
            try {
                init(function (v) {
                    if (promise._state != 0 /* Pending */) {
                        Promise.checkHandler("trying to resolve promise more than once");
                        return;
                    }
                    promise._value = v;
                    promise._state = 1 /* Success */;
                    promise._notifyListeners();
                }, function (v) {
                    if (promise._state == 2 /* Error */) {
                        Promise.checkHandler("trying to resolve (error) promise more than once");
                        return;
                    }
                    promise._value = v || new Error("An error occured");
                    promise._state = 2 /* Error */;
                    promise._notifyListeners();
                }, undefined);
            }
            catch (err) {
                Promise.errorHandler("promiseCtor", err);
            }
        }
    }
    Promise.prototype._notify = function (l) {
        if (this._value instanceof Promise) {
            var p = this._value;
            if (!!p._state)
                p._notify(l);
            else
                p._listeners.push(l);
        }
        else
            l._onNotify(this);
    };
    Promise.prototype.isPending = function () {
        return this._state == 0 /* Pending */;
    };
    Promise.prototype._notifyListeners = function () {
        var _this = this;
        this._listeners.forEach(function (p) { return _this._notify(p); });
    };
    Promise.propagate = function (s, v, onSuccess, onError) {
        if (s === 1 /* Success */ && v instanceof Promise) {
            var q = v;
            if (!!q._state) {
                v = q._value;
                if (q._state == 2 /* Error */)
                    s = 2 /* Error */;
            }
            else {
                q._listeners.push(new Promise(undefined, function () {
                    Promise.propagate(q._state, q._value, onSuccess, onError);
                }));
                return;
            }
        }
        if (s === 2 /* Error */)
            onError(v);
        else
            onSuccess(v);
    };
    Promise.prototype.then = function (onSuccess, onError, onProgress) {
        if (onError === void 0) { onError = undefined; }
        if (onProgress === void 0) { onProgress = undefined; }
        var onSuccess3;
        var onError3;
        var r = new Promise(function (onSuccess2, onError2, onProgress2) {
            onSuccess3 = onSuccess2;
            onError3 = onError2;
        }, function (p) {
            var v = p._value;
            var s = p._state;
            if (s === 2 /* Error */) {
                if (!!onError)
                    try {
                        v = onError(v);
                        s = 1 /* Success */;
                    }
                    catch (e) {
                        v = e;
                        s = 2 /* Error */;
                    }
            }
            else {
                if (!!onSuccess)
                    try {
                        v = onSuccess(v);
                        s = 1 /* Success */;
                    }
                    catch (e) {
                        v = e;
                        s = 2 /* Error */;
                    }
            }
            Promise.propagate(s, v, onSuccess3, onError3);
        });
        if (!!this._state)
            this._notify(r);
        else
            this._listeners.push(r);
        return r;
    };
    Promise.prototype.done = function (onSuccess, onError, onProgress) {
        if (onSuccess === void 0) { onSuccess = undefined; }
        if (onError === void 0) { onError = undefined; }
        if (onProgress === void 0) { onProgress = undefined; }
        this.then(onSuccess, onError, onProgress).then(undefined, function (e) {
            Promise.errorHandler("promiseDone", e);
        });
    };
    Promise.prototype.thenalways = function (onSuccessOrError, onProgress) {
        if (onProgress === void 0) { onProgress = undefined; }
        return this.then(onSuccessOrError, onSuccessOrError, onProgress);
    };
    Promise.is = function (v) {
        return v instanceof Promise;
    };
    Promise.as = function (v) {
        if (v === void 0) { v = undefined; }
        return v instanceof Promise ? v : Promise.wrap(v);
    };
    Promise.wrap = function (v) {
        if (v === void 0) { v = undefined; }
        return new Promise(function (onSuccess, onError, onProgress) {
            onSuccess(v);
        });
    };
    Promise.wrapError = function (v) {
        if (v === void 0) { v = undefined; }
        return new Promise(function (onSuccess, onError, onProgress) {
            onError(v);
        });
    };
    Promise.delay = function (ms, f) {
        if (f === void 0) { f = null; }
        return new Promise(function (onSuccess, onError, onProgress) {
            window.setTimeout(function () { return f ? f().then(function (v) { return onSuccess(v); }, function (e) { return onError(e); }, function (v) { return onProgress(v); }) : onSuccess(undefined); }, ms);
        });
    };
    Promise.join = function (values) {
        return new Promise(function (onSuccess, onError, onProgress) {
            var keys = Object.keys(values);
            var errors = Array.isArray(values) ? new Array(values.length) : {};
            var results = Array.isArray(values) ? new Array(values.length) : {};
            if (keys.length == 0) {
                onSuccess(results);
                return;
            }
            var missing = keys.length;
            var next = function () {
                if (--missing == 0)
                    if (Object.keys(errors).length == 0)
                        onSuccess(results);
                    else
                        onError(errors);
            };
            keys.forEach(function (key) {
                Promise.as(values[key]).then(function (v) {
                    results[key] = v;
                    next();
                }, function (v) {
                    errors[key] = v;
                    next();
                });
            });
        });
    };
    Promise.thenEach = function (values, onSuccess, onError, onProgress) {
        if (onSuccess === void 0) { onSuccess = undefined; }
        if (onError === void 0) { onError = undefined; }
        if (onProgress === void 0) { onProgress = undefined; }
        var result = Array.isArray(values) ? new Array(values.length) : {};
        Object.keys(values).forEach(function (key) {
            result[key] = Promise.as(values[key]).then(onSuccess, onError, onProgress);
        });
        return Promise.join(result);
    };
    Promise.sequentialMap = function (values, f) {
        return new Promise(function (onSuccess, onError, onProgress) {
            var keys = Object.keys(values);
            var results = Array.isArray(values) ? new Array(values.length) : {};
            function next(i) {
                if (i >= keys.length) {
                    onSuccess(results);
                }
                else {
                    var key = keys[i];
                    try {
                        Promise.as(values[key]).done(function (x) {
                            Promise.as(f(x, key, results)).done(function (v) {
                                results[key] = v;
                                next(i + 1);
                            }, onError);
                        });
                    }
                    catch (e) {
                        onError(e);
                    }
                }
            }
            next(0);
        });
    };
    Promise.errorHandler = function (ctx, err) {
        throw err;
    };
    Promise.checkHandler = function (msg) {
        Promise.errorHandler("promise-check", new Error(msg));
    };
    return Promise;
})();
var PromiseInv = (function (_super) {
    __extends(PromiseInv, _super);
    function PromiseInv() {
        var _this = this;
        _super.call(this, function (onSuccess, onError) {
            _this.success = onSuccess;
            _this.error = onError;
        });
    }
    PromiseInv.as = function (v) {
        if (v === void 0) { v = undefined; }
        var r = new PromiseInv();
        r.success(v);
        return r;
    };
    return PromiseInv;
})(Promise);
var StringBuilder = (function () {
    function StringBuilder(str) {
        this._parts = typeof str !== "undefined" && str !== null && str !== "" ? [str] : [];
        this._value = "";
        this._len = 0;
    }
    StringBuilder.prototype.append = function (str) {
        if (!(typeof str === "undefined" || str === null || str === "")) {
            this._parts[this._parts.length] = str;
        }
    };
    StringBuilder.prototype.appendLine = function (str) {
        this._parts[this._parts.length] = typeof str === "undefined" || str === null || str === "" ? "\r\n" : str + "\r\n";
    };
    StringBuilder.prototype.clear = function () {
        this._parts = [];
        this._value = "";
        this._len = 0;
    };
    StringBuilder.prototype.isEmpty = function () {
        if (this._parts.length === 0) {
            return true;
        }
        return (this.toString() === "");
    };
    StringBuilder.prototype.toString = function () {
        if (this._len !== this._parts.length) {
            this._len = this._parts.length;
            this._value = this._parts.join("");
        }
        return this._value;
    };
    return StringBuilder;
})();
var StringInternals = (function () {
    function StringInternals() {
    }
    StringInternals.escapeRegExp = function (str) {
        return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    };
    StringInternals.defaultToWhiteSpace = function (characters) {
        if ((characters === undefined) || (characters === null)) {
            return '\\s';
        }
        else {
            var s = characters.source;
            if (s) {
                return s;
            }
            else {
                return '[' + StringInternals.escapeRegExp(characters) + ']';
            }
        }
    };
    StringInternals.nativeTrimLeft = String.prototype.trimLeft;
    StringInternals.nativeTrimRight = String.prototype.trimRight;
    StringInternals.nativeTrim = String.prototype.trim;
    return StringInternals;
})();
;
String.prototype.isEmpty = function () {
    return (this === "");
};
String.prototype.startsWith = function (str, ignoreCase) {
    if (ignoreCase) {
        return (this.substr(0, str.length).toLowerCase() === str.toLowerCase());
    }
    else {
        return (this.substr(0, str.length) === str);
    }
};
String.prototype.endsWith = function (str, ignoreCase) {
    if (ignoreCase) {
        return (this.substring(this.length - str.length).toLowerCase() === str.toLowerCase());
    }
    else {
        return (this.substring(this.length - str.length) === str);
    }
};
String.prototype.trimStart = function (trimChars) {
    if (!trimChars && StringInternals.nativeTrimLeft) {
        return StringInternals.nativeTrimLeft.call(this);
    }
    trimChars = StringInternals.defaultToWhiteSpace(trimChars);
    return this.replace(new RegExp('^' + trimChars + '+'), '');
};
String.prototype.trimEnd = function (trimChars) {
    if (!trimChars && StringInternals.nativeTrimRight) {
        return StringInternals.nativeTrimRight.call(this);
    }
    trimChars = StringInternals.defaultToWhiteSpace(trimChars);
    return this.replace(new RegExp(trimChars + '+$'), '');
};
String.prototype.trim = function (trimChars) {
    if (!trimChars && StringInternals.nativeTrim) {
        return StringInternals.nativeTrim.call(this);
    }
    trimChars = StringInternals.defaultToWhiteSpace(trimChars);
    return this.replace(new RegExp('^' + trimChars + '+|' + trimChars + '+$', 'g'), '');
};
String.prototype.replaceAll = function (pattern, replace, ignorecase) {
    var flags = (ignorecase === true) ? 'gi' : 'g';
    var reg = new RegExp(pattern, flags);
    return this.replace(reg, replace);
};
String.isNullOrEmpty = function (str) {
    return (str === undefined) || (str === null) || (str === "");
};
String.repeat = function (str, count) {
    if (count < 1)
        return "";
    var result = "";
    while (count > 0) {
        if (count & 1) {
            result += str;
        }
        count >>= 1, str += str;
    }
    return result;
};
String.format = function (formatString) {
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    if (params.length <= 0) {
        throw new Exception("String.format() failed. The length of params is less than 0.params = " + params.length);
    }
    for (var i = 0; i < params.length; i++) {
        var placeholder = "{" + i + "}";
        formatString = formatString.replace(placeholder, params[i].toString());
    }
    return formatString;
};
var StringUtility = (function () {
    function StringUtility() {
    }
    StringUtility.TrimEnd = function (str, ch) {
        if (ch.length !== 1) {
            throw new Exception("TrimEnd() failed. The length of ch is not equal to 1. ch=" + ch);
        }
        var n = ch.charCodeAt(0);
        for (var i = str.length - 1; i >= 0; i--) {
            if (str.charCodeAt(i) != n) {
                if (i == (str.length - 1)) {
                    return str;
                }
                return str.substr(0, i + 1);
            }
        }
        return "";
    };
    StringUtility.levenshtein = function (str1, str2) {
        var current = [], prev, value;
        for (var i = 0; i <= str2.length; i++) {
            for (var j = 0; j <= str1.length; j++) {
                if (i && j) {
                    if (str1.charAt(j - 1) === str2.charAt(i - 1)) {
                        value = prev;
                    }
                    else {
                        value = Math.min(current[j], current[j - 1], prev) + 1;
                    }
                }
                else {
                    value = i + j;
                }
                prev = current[j];
                current[j] = value;
            }
        }
        return current.pop();
    };
    StringUtility.ConvertToHtml = function (str) {
        var linebs = '<br />';
        var jpTagbrTag = true;
        var tfEncode = true;
        str = str.replace(/\r\n/g, "XiLBXZRNG");
        str = str.replace(/\n/g, "XiLBXZNG");
        str = str.replace(/\r/g, "XiLBXZRG");
        var i = str.length, aRet = [];
        if (tfEncode) {
            var isConvertSpace = false;
            while (i--) {
                var iC = str.charCodeAt(i);
                if (iC == 39 || iC == 60 || iC == 62 || iC == 32 || iC == 34 || iC == 38 || (iC == 96) || iC > 127) {
                    if (isConvertSpace && iC == 32) {
                        aRet[i] = "&nbsp;";
                    }
                    else {
                        aRet[i] = '&#' + iC + ';';
                    }
                    if (iC == 32) {
                        isConvertSpace = true;
                    }
                    else {
                        isConvertSpace = false;
                    }
                }
                else {
                    aRet[i] = str.charAt(i);
                    isConvertSpace = false;
                }
            }
            str = aRet.join('');
            var relq = /\&\#10\;/g;
            str = str.replace(relq, " ");
            relq = /\&\#9\;/g;
            str = str.replace(relq, " ");
            str = str.replace(/</g, "&lt;");
            str = str.replace(/>/g, "&gt;");
            str = str.replace(/\'/g, "&#39;");
            str = str.replace(/\"/g, "&quot;");
            var tf1 = new Array("&#169;", "&#174;", "&#178;", "&#179;", "&#34;", "&#38;", "&#8211;", "&#8212;", "&#8216;", "&#8217;", "&#8220;", "&#8221;", "&#8226;", "&#8224;", "&#8225;", "&#8242;", "&#8243;", "&#8249;", "&#8250;", "&#8364;", "&#8482;", "&#732;", "&#710;", "&#9824;", "&#9827;", "&#9829;", "&#9830;", "&#9674;", "&#8592;", "&#8594;", "&#8593;", "&#8595;", "&#8596;", "&#172;", "&#161;", "&#162;", "&#163;", "&#164;", "&#165;", "&#166;", "&#167;", "&#168;", "&#170;", "&#171;", "&#172;", "&#173;", "&#175;", "&#176;", "&#177;", "&#180;", "&#181;", "&#182;", "&#183;", "&#184;", "&#185;", "&#186;", "&#187;", "&#188;", "&#189;", "&#190;", "&#191;", "&#192;", "&#193;", "&#194;", "&#195;", "&#196;", "&#197;", "&#198;", "&#199;", "&#200;", "&#201;", "&#202;", "&#203;", "&#204;", "&#205;", "&#206;", "&#207;", "&#208;", "&#209;", "&#210;", "&#211;", "&#212;", "&#213;", "&#214;", "&#215;", "&#216;", "&#217;", "&#218;", "&#219;", "&#220;", "&#221;", "&#222;", "&#223;", "&#224;", "&#225;", "&#226;", "&#227;", "&#228;", "&#229;", "&#230;", "&#231;", "&#232;", "&#233;", "&#234;", "&#235;", "&#236;", "&#237;", "&#238;", "&#239;", "&#240;", "&#241;", "&#242;", "&#243;", "&#244;", "&#245;", "&#246;", "&#247;", "&#248;", "&#249;", "&#250;", "&#251;", "&#252;", "&#253;", "&#254;", "&#255;");
            var tf2 = new Array("&copy;", "&reg;", "&sup2;", "&sup3;", "&quot;", "&amp;", "&ndash;", "&mdash;", "&lsquo;", "&rsquo;", "&ldquo;", "&rdquo;", "&bull;", "&dagger;", "&Dagger;", "&prime;", "&Prime;", "&lsaquo;", "&rsaquo;", "&euro;", "&trade;", "&tilde;", "&circ;", "&spades;", "&clubs;", "&hearts;", "&diams;", "&loz;", "&larr;", "&rarr;", "&uarr;", "&darr;", "&harr;", "&not;", "&iexcl;", "&cent;", "&pound;", "&curren;", "&yen;", "&brvbar;", "&sect;", "&uml;", "&ordf;", "&laquo;", "&not;", "&shy;", "&macr;", "&deg;", "&plusmn;", "&acute;", "&micro;", "&para;", "&middot;", "&cedil;", "&sup1;", "&ordm;", "&raquo;", "&frac14;", "&frac12;", "&frac34;", "&iquest;", "&Agrave;", "&Aacute;", "&Acirc;", "&Atilde;", "&Auml;", "&Aring;", "&AElig;", "&Ccedil;", "&Egrave;", "&Eacute;", "&Ecirc;", "&Euml;", "&Igrave;", "&Iacute;", "&Icirc;", "&Iuml;", "&ETH;", "&Ntilde;", "&Ograve;", "&Oacute;", "&Ocirc;", "&Otilde;", "&Ouml;", "&times;", "&Oslash;", "&Ugrave;", "&Uacute;", "&Ucirc;", "&Uuml;", "&Yacute;", "&THORN;", "&szlig;", "&agrave;", "&aacute;", "&acirc;", "&atilde;", "&auml;", "&aring;", "&aelig;", "&ccedil;", "&egrave;", "&eacute;", "&ecirc;", "&euml;", "&igrave;", "&iacute;", "&icirc;", "&iuml;", "&eth;", "&ntilde;", "&ograve;", "&oacute;", "&ocirc;", "&otilde;", "&ouml;", "&divide;", "&oslash;", "&ugrave;", "&uacute;", "&ucirc;", "&uuml;", "&yacute;", "&thorn;", "&yuml;");
            for (var ii = 0; ii < tf1.length; ii++) {
                str = str.replace(new RegExp(tf1[ii], "g"), tf2[ii]);
            }
        }
        var re4 = /XiLBXZRNG/gi;
        str = str.replace(re4, "<br/>");
        var re5 = /XiLBXZRG/gi;
        str = str.replace(re5, "<br/>");
        var re6 = /XiLBXZNG/gi;
        str = str.replace(re6, "<br/>");
        str = '<p>' + str + '</p>';
        return str;
    };
    return StringUtility;
})();
var StringMap = (function () {
    function StringMap() {
        this.items = {};
        this.length = 0;
    }
    StringMap.fromArray = function (array, keySelector) {
        var map = new StringMap();
        array.forEach(function (v) {
            map.items[keySelector(v)] = v;
        });
        map.length = array.length;
        return map;
    };
    StringMap.prototype.count = function () {
        return this.length;
    };
    StringMap.prototype.keys = function () {
        var keys = Object.keys(this.items);
        return keys;
    };
    StringMap.prototype.values = function () {
        var values = [];
        for (var stringKey in this.items) {
            values.push(this.items[stringKey]);
        }
        return values;
    };
    StringMap.prototype.forEachValue = function (callbackfn) {
        for (var stringKey in this.items) {
            if (callbackfn(this.items[stringKey])) {
                break;
            }
        }
    };
    StringMap.prototype.at = function (key) {
        var result = this.items[key];
        return (result);
    };
    StringMap.prototype.set = function (key, value) {
        var val = this.items[key];
        if (val != value) {
            if (val != null) {
                this.length--;
                delete this.items[key];
            }
            if (value != null) {
                this.items[key] = value;
                this.length++;
            }
        }
    };
    StringMap.prototype.clear = function () {
        this.items = {};
        this.length = 0;
    };
    StringMap.prototype.setMany = function (stringMap) {
        var _this = this;
        var stringKeys = Object.keys(stringMap.items);
        stringKeys.forEach(function (stringKey) {
            var value = stringMap.items[stringKey];
            _this.items[stringKey] = value;
            _this.length++;
        });
    };
    StringMap.prototype.remove = function (key) {
        var val = this.items[key];
        if (val != null) {
            this.length--;
            delete this.items[key];
            return val;
        }
        return null;
    };
    StringMap.prototype.toString = function () {
        var _this = this;
        var s = "{" + Object.keys(this.items).map(function (key) { return key + "->" + _this.items[key]; }).join(",") + "}";
        return s;
    };
    return StringMap;
})();
var Uri = (function () {
    function Uri() {
    }
    Uri.Combine = function (url1, url2) {
        var url = url1.endsWith("/") ? url1 : url1.concat("/");
        return url.concat(url2.startsWith("/") ? url2.substring(1) : url2);
    };
    return Uri;
})();
//# sourceMappingURL=foundation.js.map