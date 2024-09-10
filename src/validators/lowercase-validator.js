"use strict";

const { createAlphanumericRegexObject } = require("./validator-helpers");

/**
 * Validate that a string contains only the characters A - Z, _ (underscore), or - (hyphen).
 * @param {String} value (required): The string to validate
 * @param {Object} rule (required): Object containing the requirements for the value to be valid.
 * @param {Boolean} [rule.lowercase](optional): case-sensitive lower case.
 * @param {Boolean} [rule.lower](optional): alias for rule.lowercase.
 * @return {Boolean}
 */
function lowercaseValidator(value, rule) {
  if(!rule?.lowercase && !rule?.lower) {
    // if the "uppercase" rule has not been defined for this value, bypass this validator
    return {
      rule,
      valid: true,
    };
  }

  if(typeof value !== "string") {
    // We can't apply the uppercase rule to non-strings.
    return {
      rule,
      valid: true,
    };
  }

  const regexStr = "[a-z\\s_-]";
  const regex = createAlphanumericRegexObject(regexStr, { ...rule, matchCase: true });
  const valid = regex.test(value);

  return {
    regex,
    rule,
    valid,
  };
}

module.exports = {
  name: "lowercaseValidator",
  validate: lowercaseValidator,
};
