module.exports = {
  array      : isArray,
  boolean    : isBoolean,
  empty      : isEmpty,
  falsy      : isFalsy,
  "function" : isFunction,
  number     : isNumber,
  numeric    : isNumeric,
  object     : isObject,
  scalar     : isScalar,
  string     : isString,
  undefined  : isUndefined,
};

function isArray(data) {
  return ((typeof Array.isArray === "function")
    ? Array.isArray(data)
    : Object.prototype.toString.call(data) === "[object Array]"
  );
}

function isBoolean(data) {
  return typeof data === "boolean";
}

function isEmpty(data) {
  if(isArray(data)) {
    return (data.length === 0);
  }

  if(isObject(data)) {
    return (Object.keys(data).length === 0);
  }

  return [0, null, false, NaN, undefined, ""].includes(data);
}

function isFalsy(val) {
  return [0, false, NaN, null, undefined, ""].includes(val);
}

function isFunction(fn) {
  return typeof fn === "function";
}

function isNumber(num) {
  num = Number(num);

  return Number.isNaN(num) ? false : true;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isObject(data) {
  return (typeof data === "object" && data && !isArray(data));
}

function isScalar(obj) {
  return (
    !isArray(obj) && !isFunction(obj) && (typeof obj !== "object")
  );
}

function isString(data) {
  return typeof data === "string";
}

function isUndefined(data) {
  return typeof data === "undefined";
}
