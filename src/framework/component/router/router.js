"use strict";

const createRouter = require("node-laravel-router").createRouter;


module.exports = class Router {
  constructor() {
    return createRouter();
  }
};
