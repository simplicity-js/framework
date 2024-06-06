"use strict";

const qs = require("qs");
const removeLastCharacter = require("./remove-last-character");

/**
 * Accepts a (Laravel-style) string uri,
 * optionally with params (e.g. /user/{userId}).
 * If the uri contains params, you can pass values for corresponding params
 * using the optional `params` object.
 * Any extra fields found in the `params` object
 * but not found in the route definition will be considered query params,
 * and will be appended to the url as a query string.
 *
 * Query strings are generated via the `qs` module/package,
 * and so you can also create query string values using the optional `options` object.
 * Any such options will get passed to qs.stringify.
 *
 * If there are any (regex) patterns defined on the params using the `patterns` object,
 * they must be honored by the supplied params, or an error will be thrown.
 *
 * @param {Object} config
 * @param {String} [config.uri]
 * @param {Object} [config.params]
 * @param {Object} [config.patterns]
 * @param {Object} [config.options]
 * @return {String}
 */
module.exports = function uriWithParams(config) {
  let { uri = "", params = {}, patterns = {}, options = {} } = config || {};

  params = Object.assign({}, params);

  /*
   * Are we currently parsing a url parameter
   */
  let parsingParam = false;

  /*
   * The current url parameter
   */
  let currentParam = "";

  /*
   * Is the current url parameter optional (false) or required (true)
   */
  let optional = false;

  /*
   * Aggregates the new URI to be returned
   */
  let newUri = "";

  for(const character of uri) {
    switch(character) {
    case "{":
      parsingParam = true;
      optional = false;
      break;

    case "}":
      if(params[currentParam] === undefined && !optional) {
        throw new Error(
          `There is no value for the non-optional param "${currentParam}".`
        );
      }

      if(patterns[currentParam] && !patterns[currentParam].test(params[currentParam])) {
        throw new Error(
          `The value "${params[currentParam]}" for the param "${currentParam}" ` +
          `fails the "${patterns[currentParam]}" constraint.`
        );
      }

      if(params[currentParam] !== undefined) {
        newUri+= encodeURI(params[currentParam]);
      }

      params[currentParam] = undefined;
      parsingParam = false;
      currentParam = "";
      break;

    case "?":
      optional = true;
      break;

    default:
      if(parsingParam) {
        currentParam += character;
      } else {
        newUri += character;
      }

      break;
    }
  }

  if(newUri.length > 1 && newUri.charAt(newUri.length - 1) === "/") {
    newUri = removeLastCharacter(newUri);
  }

  options.addQueryPrefix = true;

  const queryString = qs.stringify(params, options);

  if(queryString.length) {
    newUri += queryString;
  }

  return newUri;
};
