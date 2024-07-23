const is = require("./is");

module.exports = {
  deepClone,
  deepEqual,
  freezeObject,
  getObjectValue,
  setObjectValue,
  //toPrimitive,
};

function cloneFunction(fn) {
  const temp = function temporary() { return fn.apply(this, arguments); };

  for(const key in fn) {
    if(Object.prototype.hasOwnProperty.call(fn, key)) {
      temp[key] = fn[key];
    }
  }

  return temp;
}

function deepClone(obj) {

  /*
   * If we are dealing with a falsy value
   * (null, undefined, the empty string, false, 0, etc.),
   * return as-is
   */
  if(!obj) {
    return obj;
  }

  /*
   * Check if we are dealing with a simple primitive/scalar type.
   * If so, return it as-is
   */
  if(is.scalar(obj)) {
    return obj;
  }

  /*
   * If we are dealing with an object of a Built-in type,
   * e.g., new Boolean(true), new Number(123), new String('Jamie'),
   * normalize it to its primitives equivalent
   */
  const primitive = toPrimitive(obj);

  /*
   * If we got a valid primitive of type Number, String or Boolean,
   * just return it
   */
  if(typeof primitive !== "undefined") {
    return primitive;
  }


  /*
   * We are dealing with a complex object
   * (such as an array, Date, HTML DOM Node, or an object literal)
   */

  let clone;

  if(is.array(obj)) {
    clone = [];

    obj.forEach((element, index) => clone[index] = deepClone(element));
  } else if(obj instanceof Date) {
    clone = new Date(obj);
  } else if(obj.nodeType && typeof obj.cloneNode === "function") { // handle (HTML) DOM nodes
    clone = obj.cloneNode(true);
  } else if(typeof obj === "function" || obj instanceof Function) {
    clone = cloneFunction(obj);
  } else {
    clone = typeof obj.constructor === "function"
      ? new obj.constructor(obj)
      :  {}; // We have an object literal

    for(const x in obj) {
      clone[x] = deepClone(obj[x]);
    }
  }

  return clone;
}

function deepEqual(x, y) {
  // credits: https://stackoverflow.com/a/25456134/1743192

  if(x === y) {
    return true;
  }

  if((typeof x == "object" && x != null) && (typeof y == "object" && y != null)) {
    if(Object.keys(x).length != Object.keys(y).length) {
      return false;
    }

    for(var prop in x) {
      if(Object.prototype.hasOwnProperty.call(y, prop)) {
        if(!deepEqual(x[prop], y[prop])) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }

  return false;
}

/**
 * Deep (recursive) Object.freeze
 */
function freezeObject(o) {
  Object.freeze(o);

  if(o === null) {
    return o;
  }

  Object.getOwnPropertyNames(o).forEach(function freezeRecursive(prop) {
    if(o[prop] && ["function", "object"].includes(typeof o[prop]) &&
      !Object.isFrozen(o[prop])) {
      freezeObject(o[prop]);
    }
  });

  return o;
}

/**
 * Retrieve (nested) value from an object.
 *
 * @param {Object} obj: the object we want to retrieve a value from.
 * @param {String} path (optional): the property to retrieve.
 *   Nested properties can be comma-separated.
 * @param {Mixed} defaultValue (optional): Value to return
 *   if no value exists for the passed property.
 * @return {Mixed}
 *
 */
function getObjectValue(obj, path, defaultValue) {
  // Cf. https://stackoverflow.com/q/54733539/1743192
  // See also: https://stackoverflow.com/a/6491621/1743192
  return path.split(".").reduce(function getObjectValueViaPath(a, c) {
    return (a && a[c] ? a[c] : defaultValue);
  }, obj);
}

/**
 * Dynamically set object key/property.
 * Overwrites previous key if exists.
 *
 * @param {Object} obj: the object to set the property on.
 * @param {String} key: the property to set.
 *   Nested keys can be comma-separated.
 * @param {Mixed}: the value to set the property to.
 */
function setObjectValue(obj, path, value) {
  // Credits: https://stackoverflow.com/a/65072147/1743192
  const paths = is.array(path) ? path : path.split(".");
  const inputObj = is.object(obj) ? { ...obj } : {};

  if(paths.length === 1) {
    inputObj[paths[0]] = value;

    return inputObj;
  }

  const [currPath, ...rest] = paths;
  const currentNode = inputObj[currPath];
  const childNode = setObjectValue(currentNode, rest, value);

  inputObj[currPath] = childNode;

  return inputObj;
};

function toPrimitive(obj) {
  for(let type of [Boolean, Number, String]) {
    if(obj instanceof type) {
      return type(obj);
    }
  }
}
