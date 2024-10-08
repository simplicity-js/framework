const is = require("../../lib/is");

module.exports = {
  createAlphanumericRegexObject,
  getLengthRegex,
  getRegexRules,
};

function createAlphanumericRegexObject(regexStr, rule, emptyLengthCharacter) {
  let lenRegex;

  if(rule.length) {
    lenRegex = getLengthRegex(rule.length);
  } else {
    lenRegex = emptyLengthCharacter || "+";
  }

  regexStr = `${regexStr}${lenRegex}`;
  regexStr = `^${regexStr}$`;

  return new RegExp(regexStr, getRegexRules(rule.matchCase));
}

function getLengthRegex(lengthRule) {
  let regexStr;
  const len = lengthRule ?? {};

  if(len.min && len.max) {
    if(Number(len.min) > Number(len.max)) {
      const tmp = len.min;

      len.min = len.max;
      len.max = tmp;
    }

    regexStr = `{${len.min},${len.max}}`;
  } else if(len.min) {
    regexStr = `{${len.min},}`;
  } else if(len.max) {
    regexStr = `{0,${len.max}}`;
  } else if(is.number(len)) {
    regexStr = `{${len}}`;
  }

  return regexStr;
}

function getRegexRules(matchCase) {
  const regexRules = ["g", "m"];

  if(matchCase) {
    return regexRules.join("");
  } else {
    return [...regexRules, "i"].join("");
  }
}
