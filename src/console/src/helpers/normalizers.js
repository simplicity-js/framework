const { pluralize, singularize, UCFirst, kebabCaseToCamelCase,
  spacedCharToUpperCase, upperCaseToKebabCase
} = require("./string");

module.exports = {
  normalizeControllerName,
  normalizeFileName,
  normalizeModelName,
  normalizeTableName,
};


function normalizeControllerName(controllerName) {
  return UCFirst(kebabCaseToCamelCase(singularize(spacedCharToUpperCase(
    controllerName)))).replace(/[_-]?controller/gi, "") + "Controller";
}

function normalizeFileName(filename) {
  return (upperCaseToKebabCase(filename)
    .replace(/_/g, "-")
    .replace(/(^-|-$)/, "")
  );
}

function normalizeModelName(modelName) {
  return UCFirst(kebabCaseToCamelCase(singularize(spacedCharToUpperCase(
    modelName)))).replace(/[_-]?model/gi, "");
}

function normalizeTableName(tableName) {
  return pluralize(
    upperCaseToKebabCase(tableName, "_")
      .replace(/(_|-)?(create|table)-?/g, "")
      .replace(/-/g, "_")
      .replace(/(^_|_$)/, "")
  );
}
