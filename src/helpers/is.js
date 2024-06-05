module.exports = {
  array      : isArray,
  empty      : isEmpty,
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

function isEmpty(data) {
  if(isArray(data)) {
    return (data.length === 0);
  }

  if(isObject(data)) {
    return (Object.keys(data).length === 0);
  }

  return [0, null, false, NaN, undefined, ""].includes(data);
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
    !isArray(obj) && (typeof obj !== "object")
  );
}

function isString(data) {
  return typeof data === "string";
}

function isUndefined(data) {
  return typeof data === "undefined";
}
