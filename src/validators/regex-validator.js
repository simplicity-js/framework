"use strict";

const is = require("../lib/is");


/**
 * Validate a value according to provided custom regular expression.
 * @param {Mixed} value (required): The value to validate
 * @param {Object} rule (required): Object containing the requirements for the value to be valid.
 * @param {Object|String} [rule.regex]: A regex string or a regex object.
 * @returns {Boolean}
 */
function regexValidator(value, rule) {
  if(!rule?.regex) {
    // if the regex rule has not been defined for this value, bypass this validator
    return {
      rule,
      valid: true,
    };
  }

  const { regex: regexStr } = rule;
  const regex = is.object(regexStr) ? regexStr : new RegExp(regexStr);
  const valid = regex.test(value);

  return {
    regex,
    rule,
    valid,
  };
}


module.exports = {
  name: "regexValidator",
  validate: regexValidator,
};
