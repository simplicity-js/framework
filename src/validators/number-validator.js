"use strict";

const { createAlphanumericRegexObject } = require("./validator-helpers");

/**
 * Validate that a value contains only numbers.
 * @param {Number|String} value (required): The string to validate
 * @param {Object} rule (required): Object containing the requirements for the value to be valid.
 * @param {String} [rule.type]: The expected type of the value.
 * @param {Boolean} [rule.allowWhitespace] (optional): specifies whether to allow whitespace or not.
 * @returns {Boolean}
 */
function numberValidator(value, rule) {
  if(rule?.type !== "number") {
    // If the "number" rule has not been specified for this value, bypass this validator.
    return {
      rule,
      valid: true,
    };
  }

  const isFalsy = value === "" || value === null || typeof value === "undefined";
  const regexStr = rule.allowWhitespace ? "[+-]?[0-9\\s]" : "[+-]?[0-9]";
  const regex = createAlphanumericRegexObject(regexStr, rule);
  const valid = isFalsy ? false : regex.test(value);

  return {
    regex,
    rule,
    valid,
  };
}


module.exports = {
  name: "numberValidator",
  validate: numberValidator,
};
