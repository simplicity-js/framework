"use strict";

const removeFirstCharacter = require("./remove-first-character");
const removeLastCharacter = require("./remove-last-character");

/**
 * Trims the forward slash (/), the caret (^), and the dollar ($) characters
 * from the beginning and end of a (regex) string.
 *
 * @param {RegExp|String} regex
 * @return {String}
 */
module.exports = function trimRegex(regex) {
  let regexString = `${regex}`;

  if(regexString.charAt(0) === "/") {
    regexString = removeFirstCharacter(regexString);
  }

  if(regexString.charAt(0) === "^") {
    regexString = removeFirstCharacter(regexString);
  }

  if(regexString.charAt(regexString.length - 1) === "/") {
    regexString = removeLastCharacter(regexString);
  }

  if(regexString.charAt(regexString.length - 1) === "$") {
    regexString = removeLastCharacter(regexString);
  }

  return regexString;
};
