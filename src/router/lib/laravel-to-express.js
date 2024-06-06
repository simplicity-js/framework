"use strict";

const trimRegex = require("./trim-regex");

/**
 * Accepts a string uri written in the Laravel style (e.g. /user/{userId})
 * and an optional object of regex patterns,
 * and returns the express.js version (e.g. /user/:userId).
 *
 * @param {String} uri
 * @param {Object} patterns
 * @return {String}
 */
module.exports = function laravelToExpress(uri = "", patterns = {}) {
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
      newUri += ":";
      break;

    case "}":
      if(patterns[currentParam]) {
        newUri += `(${trimRegex(patterns[currentParam])})`;
      }

      if(optional) {
        newUri += "?";
      }

      parsingParam = false;
      currentParam = "";
      break;

    case "?":
      optional = true;
      break;

    default:
      if(parsingParam) {
        currentParam += character;
      }

      newUri += character;
      break;
    }
  }

  return newUri;
};
