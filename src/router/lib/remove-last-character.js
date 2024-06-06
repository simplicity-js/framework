"use strict";

/**
 * Remove the last character from a string.
 *
 * @param {String} str
 * @return {String}
 */
module.exports = function removeLastCharacter(str) { 
  return str.slice(0, str.length - 1);
};
