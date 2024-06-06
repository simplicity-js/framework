"use strict";

/**
 * Accepts a string uri written in the Laravel style (e.g. /user/{userId})
 * or the Express style (e.g /user/:userId)
 * or a mixture of both (e.g., /users/{userId}/messages/:messageId)
 * and returns an object that includes and array of
 * required and optional params found in the uri.
 *
 * @param {String} uri
 * @return {Object}: { optional: Array, required: Array }
 */
module.exports = function paramsFromUri(uri = "") {
  /*
   * Aggregates the optional and required parameters of the uri
   */
  const params = {
    optional: [],
    required: []
  };

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
   * The current uri style (Laravel or Express) we are parsing
   */
  let currentUrlStyle;

  for(const character of uri) {
    switch(character) {
    case "{": // Laravel-style url param opening
    case ":": // Express-style url param opening
      parsingParam = true;
      optional = false;
      currentUrlStyle = character === "{" ? "laravel" : "express";
      break;

    // Laravel-style url param closing
    case "}":
      params[optional ? "optional" : "required"].push(currentParam);
      parsingParam = false;
      currentParam = "";
      break;

    // For Express-style url,
    // signals ending of a url param (if we are currently parsing one)
    case "/":
      // Both Laravel and Express URIs support the forward-slash (/) character.
      // We apply this only when dealing with Express style url
      // as the "}" case already handles the Laravel-style url closing.
      // Otherwise, we will end up with duplicate parameters
      // when dealing with Laravel-style url param closing.
      if(parsingParam && currentUrlStyle === "express") {
        params[optional ? "optional" : "required"].push(currentParam);
        parsingParam = false;
        currentParam = "";
      }
      break;

    case "?":
      optional = true;
      break;

    default:
      if(parsingParam) {
        currentParam += character;
      }

      break;
    }
  }

  return params;
};
