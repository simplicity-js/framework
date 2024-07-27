"use strict";

const container = require("../container");


class ServiceProvider {
  #container = null;

  constructor() {
    this.#container = container;
  }

  container() {
    return this.#container;
  }
}

module.exports = ServiceProvider;
