"use strict";

const createRouter = require("node-laravel-router").createRouter;
const { createRequestHandler } = require("./routing-functions");


module.exports = {
  router: createRouter,
  createRequestHandler: createRequestHandler
};
