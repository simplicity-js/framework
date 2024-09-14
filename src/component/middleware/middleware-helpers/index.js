"use strict";

const is = require("../../../lib/is");

module.exports = {
  generateErrors,
  generateReadonlyApi,
  flashErrors,
  flashFormValues,
  serialize,
  deserialize,
  unflashErrors,
  unflashFormValues,
  trim,
};

function generateErrors(object, error) {
  const existingErrors = object.errors || {};

  return {
    ...existingErrors,
    [error.name]: {
      ...generateReadonlyApi(error, {
        dataContainer: "fields"
      }),
      name: error.name
    },
  };
}

function generateReadonlyApi(object, options) {
  object = object ?? {};
  const fields = options?.dataContainer || object;
  const methods = {
    get: (name) => name ? fields[name] : object,
    has: (name) => typeof fields[name] !== "undefined",
    contains: (name) => this.has(name),
    includes: (name) => this.has(name)
  };

  Object.entries(methods).forEach(([k, v]) => object[k] = v.bind(object));

  return object;
}

function flashErrors(req, res) {
  if(res.locals.errors && req.session) {
    req.session.errors = serialize(res.locals.errors);
  }
}

function flashFormValues(req) {
  const formData = req.body;

  if(req.session) {
    req.session.form = serialize(generateReadonlyApi({ ...formData }));
  }
}

function serialize(obj) {
  return JSON.stringify(obj, function jsonStringifyReplacer(key, value) {
    // if we get a function give us the code for that function
    return typeof value === "function" ? value.toString() : value;
  }, 2);
}

function deserialize(json) {
  return JSON.parse(json, function jsonParseReviver(key, value) {
    if(typeof key === "string" && key.startsWith("function ")) {
      let functionTemplate = `(${value})`;

      return eval(functionTemplate);
    }

    return value;
  });
}

function unflashErrors(req, res) {
  delete req.session?.errors;
  delete res.locals.errors;
}

function unflashFormValues(req, res) {
  delete req.session?.form;
  delete res.locals.form;
}

function trim(data) {
  let trimmed;

  if(!data || is.boolean(data) || is.function(data) || is.number(data)) {
    trimmed = data;
  } else if(is.string(data)) {
    trimmed = data.trim();
  } else if(is.array(data)) {
    trimmed = data.map(trim);
  } else if(is.object(data)) {
    trimmed = {};

    for(const [key, value] of Object.entries(data)) {
      if(Object.hasOwnProperty.call(data, key)) {
        trimmed[key] = trim(value);
      }
    }
  }

  return trimmed;
}
