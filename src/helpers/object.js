const is = require("./is");


module.exports = {
  deepClone,
  deepEqual,
  freezeObject,
  //toPrimitive,
};


function deepClone(obj) {

  // If we are dealing with a falsy value
  // (null, undefined, the empty string, false, 0, etc.),
  // return as-is
  if(!obj) {
    return obj;
  }

  // Check if we are dealing with a simple primitive/scalar type.
  // If so, return it as-is
  if(is.scalar(obj)) {
    return obj;
  }

  // If we are dealing with an object of a Built-in type,
  // e.g., new Boolean(true), new Number(123), new String('Jamie'),
  // normalize it to its primitives equivalent
  const primitive = toPrimitive(obj);

  // If we got a valid primitive of type Number, String or Boolean,
  // just return it
  if(typeof primitive !== "undefined") {
    return primitive;
  }


  // We are dealing with a complex object
  // (such as an array, Date, HTML DOM Node, or an object literal)

  let clone;

  if(is.array(obj)) {
    clone = [];

    obj.forEach((element, index) => clone[index] = deepClone(element));
  } else if(obj instanceof Date) {
    clone = new Date(obj);
  } else if(obj.nodeType && typeof obj.cloneNode === "function") { // handle (HTML) DOM nodes
    clone = obj.cloneNode(true);
  } else { // We have an object literal
    clone = {};

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

function toPrimitive(obj) {
  let primitive = obj;

  for(let type of [Boolean, Number, String]) {
    if(obj instanceof type) {
      primitive = type(obj);
      break;
    }
  }

  return primitive;
}
