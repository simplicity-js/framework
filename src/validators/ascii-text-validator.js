"use strict";

const { createAlphanumericRegexObject } = require("./validator-helpers");

/**
 * Validate that a string contains only ascii text characters.
 * @param {String} value (required): The string to validate
 * @param {Object} rule (required): Object containing the requirements for the value to be valid.
 * @param {String} [rule.type]: the expected type of the value.
 * @return {Boolean}
 */
function asciiTextValidator(value, rule) {
  if(rule?.type !== "ascii") {
    // if the "ascii" rule has not been defined for this value, bypass this validator
    return {
      rule,
      valid: true,
    };
  }

  const regexStr = "[A-Z0-9`~!@#$%^&*()-+=\\[\\]{}\\\\;:'\"|<>?\\,\\.?\\/\\s_-]"; // \\\\ = support for backward slash
  const regex = createAlphanumericRegexObject(regexStr, rule);
  const valid = value ? regex.test(value) : false;

  return {
    regex,
    rule,
    valid,
  };
}

module.exports = {
  name: "asciiTextValidator",
  validate: asciiTextValidator,
};
