"use strict";

/**
 * Validate that a value is not empty, that is, not undefined.
 * @param {String} value (required): The value to validate
 * @param {Object} rule (required): Object containing the requirements for the value to be valid.
 * @param {Boolean} [rule.required]: Dictates whether or not the value is required.
 * @returns {Boolean}
 */
function requiredFieldValidator(value, rule) {
  let valid;

  if(!rule?.required) {
    valid = true; // bypass this validation if no rule has been specified for it.
  } else if(value === "" || typeof value === "undefined") {
    valid = false;
  } else {
    valid = true;
  }

  return {
    regex: "",
    rule,
    valid,
  };
}


module.exports = {
  name: "requiredValidator",
  validate: requiredFieldValidator,
};
