"use strict";

/**
 * Create and export a Dependncy Injection Container
 */

const awilix = require("awilix");

const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.PROXY,
  strict: true,
});


module.exports = {
  bindWithClass(key, value, params) {
    let resolver = awilix.asClass(value);

    if(params) {
      resolver = resolver.inject(() => params);
    }

    container.register({
      [key]: resolver
    });
  },

  bindWithFunction(key, value, params) {
    let resolver = awilix.asFunction(value);

    if(params) {
      resolver = resolver.inject(() => params);
    }

    container.register({
      [key]: resolver,
    });
  },

  resolve(key) {
    return container.resolve(key);
  },
};
