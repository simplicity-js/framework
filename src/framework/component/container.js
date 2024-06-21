"use strict";

/**
 * Create and export a Dependncy Injection Container
 */

const awilix = require("awilix");
const { asClass, asFunction, asValue } = awilix;

const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.PROXY,
  strict: true,
});


module.exports = {
  /**
   * Bind a value using a resolver function.
   * The resolver function receives the container as parameter
   * and should return the value to be bound inside the container.
   *
   * @param {String} name: The name to associate with the bound data.
   * @param {Function} resolver: The resolver function that returns the data to bind.
   */
  bind(name, resolver) {
    container.register(name, asFunction(function bind() {
      return resolver(container);
    }));

    return this;
  },

  /**
   * Bind already instantiated object inside the container.
   *
   * @param {String} name: The name to associate with the class instance
   * @param {Object} instance: The instance we want to bind.
   */
  instance(name, instance) {
    container.register(name, asValue(instance));

    return this;
  },

  /**
   * Bind class instance inside the container.
   *
   * @param {String} name: The name to associate with the class instance
   * @param {Object} className: The class whose instance we want to bind.
   */
  instantiate(name, className) {
    container.register(name, asClass(className));

    return this;
  },

  /**
   * Bind an arbitrary value inside the container.
   * @param {String} name: The name to associate with the bound value.
   * @param {Mixed} value: The value to be bound.
   */
  value(name, value) {
    container.register(name, asValue(value));

    return this;
  },

  resolve(key) {
    return container.resolve(key);
  },
};
