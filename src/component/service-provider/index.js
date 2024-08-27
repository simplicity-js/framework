"use strict";


module.exports = class ServiceProvider {
  #appRoot = "";
  #config = null;
  #container = null;

  constructor(options) {
    const { appRoot, config, container } = options || {};

    this.#appRoot = appRoot;
    this.#config = config;
    this.#container = container;
  }

  appRoot() {
    return this.#appRoot;
  }

  config() {
    return this.#config;
  }

  container() {
    return this.#container;
  }
};
