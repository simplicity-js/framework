"use strict";

const container = require("./container");


class ServiceProvider {
  #container;

  constructor() {
    this.#container = container;
  }

  container() {
    return this.#container;
  }
}

module.exports = ServiceProvider;
