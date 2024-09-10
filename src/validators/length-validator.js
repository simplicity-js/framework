"use strict";

const is = require("../lib/is");
const { createAlphanumericRegexObject } = require("./validator-helpers");

/**
 * Validate that a string conforms to the passed length requirements.
 * @param {String} value (required): The value to validate
 * @param {Object} rule (required): Object containing the requirements for the value to be valid.
 * @param {Number|Object} [rule.length] (required): The length requirements.
 * @param {Number} [rule.length.min] (optional): minimum length requirement.
 * @param {Number} [rule.length.max] (optional): maximum length requirement.
 * @returns {Boolean}
 */
function lengthValidator(value, rule) {
  const isFalsy = typeof value === "undefined" || value === null || value === false;
  const regexStr = "[A-Z0-9.\\s_-]";
  const regex = createAlphanumericRegexObject(regexStr, rule, "*");
  const valid = isFalsy ? false : regex.test(value);

  if(!(is.number(rule?.length)) && !(is.object(rule?.length))) {
    // If the length rule has not been defined for the value, bypass this validator
    return {
      regex,
      rule,
      valid: true,
    };
  }

  return {
    regex,
    rule,
    valid,
  };
}

module.exports = {
  name: "lengthValidator",
  validate: lengthValidator,
};
