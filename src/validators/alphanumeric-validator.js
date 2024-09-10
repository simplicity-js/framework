"use strict";

const { createAlphanumericRegexObject } = require("./validator-helpers");

/**
* Validate that a string contains only alphanumeric characters, _ (underscore), or - (hyphen).
* @param {String} value (required): The string to validate
* @param {Object} rule (required): Object containing the requirements for the value to be valid.
* @param {String} [rule.type]: the expected type of the value.
* @param {Boolean} [rule.allowWhitespace] (optional): specifies whether to allow whitespace or not.
* @return {Boolean}
*/
function alphanumericValidator(value, rule) {
  if(rule?.type !== "alnum") {
    // if the "alnum" rule has not been defined for this value, bypass this validator
    return {
      rule,
      valid: true,
    };
  }

  const regexStr = rule.allowWhitespace ? "[A-Z0-9\\s_+-]" : "[A-Z0-9_+-]";
  const regex = createAlphanumericRegexObject(regexStr, rule);
  const valid = value ? regex.test(value) : false;

  return {
    regex,
    rule,
    valid,
  };
}

module.exports = {
  name: "alphanumericValidator",
  validate: alphanumericValidator,
};
