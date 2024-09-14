"use strict";

const is = require("../../lib/is");
const validators = require("../../validators");
const { getRequestType } = require("../http/methods");
const {
  generateErrors, generateReadonlyApi,
  flashErrors, flashFormValues,
  unflashErrors, unflashFormValues,
  trim
} = require("./middleware-helpers");

class RequestField {
  constructor(name) {
    this.name = name;
    this.rules = {};
  }

  /**
   * Add a new rule to a SmartField instance or update the existing rule for the instance.
   * @param {Object} rule: Object containing the requirements for the field's value to be valid.
   * @param {Boolean} [rule.required]: determines if the field is required.
   * @param {Number|Object} [rule.length]: specify the accepted input length.
   *    If the value is a number, it specifies the maximum length.
   *    If the value is an object, it specifies the minimum and/or maximum length.
   * @param {Number} [rule.length.min]: specifies the mininum accepted input length
   * @param {Number} [rule.length.max]: specifies the maximum accepted input length
   * @param {Boolean} [rule.allowWhitespace]: specifies if white-space characters are allowed.
   * @param {Boolean} [rule.matchCase]: performs a case-sensitive (true) or case-insensitive(false) validation.
   * @param {String} [rule.type]: the input field's expected data type (alnum|alpha|ascii|email|number|text).
   *    Default is alnum.
   * @param {String} [rule.regex]: specifies a custom validation regex
   * @param {Boolean} replace (optional): replace the existing rule completely with the new rule.
   *    This will not only overwrite a specific key, but replace the entire previous `rule` object.
   *
   * @returns this
   *
   */
  addRule(rule) {
    const existingRules = this.rules;

    if(is.object(existingRules) && is.object(rule)) {
      this.rules = { ...existingRules, ...rule };

      if(rule.length) {
        this.rules.length = { ...(existingRules.length ?? {}), ...rule.length };
      }
    } else {
      this.rules = rule;
    }

    return this;
  }

  /**
   * Delete the rule for this instance.
   * @param {String} key (optional): If specified, delete only the specified rule.
   * Otherwise, delete the entire rule object for this instance.
   *
   * @returns this
   */
  removeRule(key) {
    const existingRules = this.rules;

    if(!is.object(existingRules)) {
      return this;
    }

    if(key) {
      delete this.rules[key];
    } else {
      delete this.rules;
    }

    return this;
  }

  /**
   * Get the rule object associated with this field
   * @param {String} key (optional): get specific rule by key.
   * @return {Boolean|Object|String|Undefined}
   */
  getRule(key) {
    if(key && this.rules) {
      return typeof this.rules[key] !== "undefined" ? this.rules[key] : null;
    } else {
      return this.rules || null;
    }
  }

  /**
   * @returns {Boolean}
   */
  validate(value) {
    const rules = this.rules;
    const validatorObjects = Object.values(validators.list());
    const results = validatorObjects.reduce((aggregator, validator) => {
      const validationResult = validator.validate(value, rules);

      if(!validationResult.valid) {
        aggregator.push({
          [validator.name.replace("Validator", "")]: validationResult
        });
      }

      return aggregator;
    }, []);

    return results;
  }
};

class ValidationHelper {
  static validationErrors = {
    alpha(field, value, rule) {
      if(rule.required && typeof value === "undefined") {
        return "";
      }

      return `The ${field} must consist of only alphabets, underscores, and dashes.`;
    },
    alphanumeric(field, value, rule) {
      if(rule.required && typeof value === "undefined") {
        return "";
      }

      return `The ${field} must consist of only alphanumeric characters, underscores, and dashes.`;
    },
    asciiText(field, value, rule) {
      if(rule.required && typeof value === "undefined") {
        return "";
      }

      if(typeof value === "string") {
        return "";
      }

      return `The ${field} must be a string.`;
    },
    email(field, value, rule) {
      if(rule.required && typeof value === "undefined") {
        return "";
      }

      return `The ${field} must be a valid email address.`;
    },
    length(field, value, rule) {
      let message;
      const len = rule.length;
      const min = Number(len.min);
      const max = Number(len.max);


      if(rule.required && typeof value === "undefined") {
        message = "";
      } else if(min > 0 && max > 0) {
        message = `The ${field} must be between ${min} and ${max} characters long.`;
      } else if(min > 0) {
        message = `The ${field} must be at least ${min} characters long.`;
      } else if(max > 0) {
        message = `The ${field} must be at most ${max} characters long.`;
      } else if(is.number(len)) {
        message = `The ${field} must be exactly ${len} characters long.`;
      }

      return message;
    },
    lowercase(field, value, rule) {
      if(rule.required && typeof value === "undefined") {
        return "";
      }

      return `The ${field} must consist of only lowercase characters.`;
    },
    number(field, value, rule) {
      if(rule.required && typeof value === "undefined") {
        return "";
      }

      return `The ${field} must consist of only numbers.`;
    },
    regex(field, value, rule) {
      if(rule.required && typeof value === "undefined") {
        return "";
      }

      return `The ${field} must satisfy the regular expression ${rule}.`;
    },
    required(field) {
      return `The ${field} field is required.`;
    },
    uppercase(field, value, rule) {
      if(rule.required && typeof value === "undefined") {
        return "";
      }

      return `The ${field} must consist of only uppercase characters.`;
    }
  };

  /**
   * Map constraint string to Validator constraint name and value
   * @param {String} ruleString
   * @returns {Object}: { [constraint]: value }
   */
  static generateRule(ruleString) {
    const data = {};
    let length = {};
    const [key, value] = ruleString.split(":").map(s => s.trim());
    const booleanAttributes = ["lower", "lowercase", "required", "upper", "uppercase", "whitespace"];
    const supportedTypes = ["alpha", "alnum", "ascii", "email", "number"];

    if(key === "regex") {
      data[key] = value;
    } else if(booleanAttributes.includes(key)) {
      if(key === "whitespace") {
        key = "allowWhitespace";
      }

      data[key] = true;
    } else if(key === "type" && supportedTypes.includes(value)) {
      // support something like 'title': 'type:alpha'
      data[key] = value;
    } else if(supportedTypes.includes(key)) {
      // also support something like 'title': 'alpha'
      data.type = key;
    } else if(key === "length") {
      const [min, max] = value.split("-").map(s => s.trim()).map(Number);

      if(typeof max === "undefined") { // `length:5`: (exactly length specified)
        length = min;
      } /*else if(min === 0) { // `length:-5`: (only `max` specified)
        length.max = max;
      } else if(max === 0) { // `length: 3-`: (min: 3, only `min` specified)
        length.min = min;
      }*/ else {
        length = { min, max };
      }
    } else if(key === "min" || key === "max") {
      length[key] = value;
    }

    if(Object.keys(length).length > 0) {
      data.length = length;
    }

    return data;
  }

  /**
   * @param {String} field: the name of the request input field
   * @param {Array<Object>} errors: the { [name]: { regex, rule, valid } }
   *   of the failed validations.
   * @return {Object}
   */
  static parseValidationErrors(field, value, errors) {
    const messages = [];
    const validationErrors = this.validationErrors;
    const validatorNames = Object.keys(validators.list())
      .map(name => name.replace("Validator", ""));

    if(Array.isArray(errors)) {
      const errorMessages = errors.reduce((aggregator, error) => {
        const [errorName, errorValue] = Object.entries(error).pop();
        const rule = errorValue.rule;

        if(validatorNames.includes(errorName)) {
          const errMsg = validationErrors[errorName](field, value, rule);

          if(errMsg.length > 0) {
            aggregator.push(errMsg);
          }
        }

        return aggregator;
      }, []);

      messages.push(...errorMessages);
    }

    return messages;
  }
}

/**
 * Augment Express req object with methods `input` and `validate`
 * and with object property `data`
 */
module.exports = function getValidationMiddleware() {
  return function validationMiddleware(req, res, next) {
    req.input = function requestInput(input) {
      if(input) {
        return trim(req.body[input] || req.params[input] || req.query[input]);
      } else {
        return trim({ ...req.body, ...req.params, ...req.query });
      }
    };

    req.data = req.input();

    /**
     * @param {Object} fieldRules, e.g:
     * {
     *    title: ['required', 'max:255'],
     *    firstname: 'required|alpha|min:3|max:20',
     *    lastname: ['required', 'type:alpha', 'length:3-20']
     *    email: { type: "email" },
     *    body: ['required'],
     *    password: 'required|length:8-'
     *    sex: 'required|length:4-6|uppercase'
     *    something: 'required|length:2'
     * }
     */
    req.validate = function validateRequestData(fieldRules) {
      const REGEX = /[\|,;]+/g;
      const validationErrors = {};
      const validatedFields = Object.create(null);

      for(let [field, rules] of Object.entries(fieldRules)) {
        const value = req.input(field);
        const requestField = new RequestField(field);

        if(typeof rules === "string") {
          rules = rules.split(REGEX);
        } else if(is.object(rules)) {
          const rulesArray = [];

          for(const [key, value] of Object.entries(rules)) {
            rulesArray.push(`${key}:${value}`);
          }

          rules = rulesArray;
        }

        rules.forEach(ruleString => {
          requestField.addRule(ValidationHelper.generateRule(ruleString));
        });

        const errors = requestField.validate(value);

        if(errors.length > 0) {
          validationErrors[field] = ValidationHelper.parseValidationErrors(
            field, value, errors
          );
        }
      }

      for(const field of Object.keys(fieldRules)) {
        Object.defineProperty(validatedFields, field, {
          enumerable: true,
          get() {
            // Guard agains attempts to get the value(s) of validated fields
            // while validation has not passed.
            const validationErrors = (
              res.locals.errors?.InvalidCSRFTokenError ||
              res.errors?.ValidationError ||
              res.locals.errors?.ValidationError
            );

            if(validationErrors) {
              throw validationErrors;
            }

            return req.input(field);
          },
        });
      }

      if(Object.keys(validationErrors).length === 0) {
        unflashErrors(req, res);
        unflashFormValues(req, res);
      } else {
        const requestType = getRequestType(req);
        if(["javascript", "json", "text", "unknown"].includes(requestType)) {
          res.errors = generateErrors(res, {
            fields: validationErrors,
            name: "ValidationError"
          });
        } else if(["form", "upload"].includes(requestType)) {
          res.locals.errors = generateErrors(res.locals, {
            fields: validationErrors,
            name: "ValidationError"
          });

          flashErrors(req, res);
          flashFormValues(req);
        }
      }

      return generateReadonlyApi(validatedFields);
    };

    next();
  };
};
