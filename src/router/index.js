"use strict";

const createRouter = require("./lib/create-router");
const laravelToExpress = require("./lib/laravel-to-express");
const uriWithParams = require("./lib/uri-with-params");
const paramsFromUri = require("./lib/params-from-uri");

module.exports = {
  createRouter,
  laravelToExpress,
  uriWithParams,
  paramsFromUri
};
