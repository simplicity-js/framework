"use strict";

const { createAlphanumericRegexObject } = require("./validator-helpers");

/**
 * Validate that a string contains only the characters A - Z, _ (underscore), or - (hyphen).
 * @param {String} value (required): The string to validate
 * @param {Object} rule (required): Object containing the requirements for the value to be valid.
 * @param {Boolean} [rule.uppercase](optional): case-sensitive upper case.
 * @param {Boolean} [rule.upper](optional): alias for rule.uppercase.
 * @return {Boolean}
 */
function uppercaseValidator(value, rule) {
  if(!rule?.uppercase && !rule?.upper) {
    // if the "uppercase" rule has not been defined for this value, bypass this validator
    return {
      rule,
      valid: true,
    };
  }

  if(typeof value !== "string") {
    return {
      rule,
      valid: true, // We can't apply the uppercase rule to non-strings.
    };
  }

  const regexStr = "[A-Z\\s_-]";
  const regex = createAlphanumericRegexObject(regexStr, { ...rule, matchCase: true });
  const valid = regex.test(value);

  return {
    regex,
    rule,
    valid,
  };
}

module.exports = {
  name: "uppercaseValidator",
  validate: uppercaseValidator,
};
