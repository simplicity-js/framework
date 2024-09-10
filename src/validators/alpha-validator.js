"use strict";

const { createAlphanumericRegexObject } = require("./validator-helpers");

/**
 * Validate that a string contains only the characters A - Z, _ (underscore), or - (hyphen).
 * @param {String} value (required): The string to validate
 * @param {Object} rule (required): Object containing the requirements for the value to be valid.
 * @param {String} [rule.type]: the expected type of the value.
 * @param {Boolean} [rule.allowWhitespace] (optional): specifies whether to allow whitespace or not.
 * @return {Boolean}
 */
function alphaValidator(value, rule) {
  if(rule?.type !== "alpha") {
    // if the "alpha" rule has not been defined for this value, bypass this validator
    return {
      rule,
      valid: true,
    };
  }

  const regexStr = rule.allowWhitespace ? "[A-Z\\s_-]" : "[A-Z_-]";
  const regex = createAlphanumericRegexObject(regexStr, rule);
  const valid = typeof value === "string" ? regex.test(value) : false;

  return {
    regex,
    rule,
    valid,
  };
}

module.exports = {
  name: "alphaValidator",
  validate: alphaValidator,
};
