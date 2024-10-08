"use strict";

const httpMethods = require("./http-methods");
const methods = require("./methods");
const StatusCodes = require("./status-codes");
const StatusTexts = require("./status-texts").statusTexts;


module.exports = {
  METHODS: httpMethods,
  STATUS_CODES: Object.assign(Object.create(null), StatusCodes),
  STATUS_TEXTS: Object.assign(Object.create(null), StatusTexts),
  //CacheControlDirectives: require("./cache-control-directives").HTTP_RESPONSE_CACHE_CONTROL_DIRECTIVES,
  ...methods,
};
