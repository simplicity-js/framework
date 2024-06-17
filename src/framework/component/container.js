"use strict";

/**
 * Create and export a Dependncy Injection Container
 */

const awilix = require("awilix");
const { asValue, asFunction } = awilix;

const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.PROXY,
  strict: true,
});


module.exports = {
  bind(name, resolver) {
    return container.register(name, asFunction(function bind() {
      return resolver(container);
    }));
  },

  instance(name, object) {
    return container.register(name, asValue(object));
  },

  value(name, val) {
    return container.register(name, asValue(val));
  },

  resolve(key) {
    return container.resolve(key);
  },
};


/*
function bindWithClass(key, value, params) {
  let resolver = awilix.asClass(value);

  if(params) {
    resolver = resolver.inject(() => params);
  }

  container.register({
    [key]: resolver
  });
}

function bindWithFunction(key, value, params) {
  let resolver = awilix.asFunction(value);

  if(params) {
    resolver = resolver.inject(() => params);
  }

  container.register({
    [key]: resolver,
  });
}
*/
