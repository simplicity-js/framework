"use strict";

let appRoot;


module.exports = function resourcePath(location) {
  return `${appRoot}/src/resources/${location ?? ""}`;
};

/**
 * Initialize the resourcePath method in the project.
 * This method should only be called once and only from inside application/index.js
 * during the application initialization.
 */
module.exports.init = function initializeResourcePath(projectDir) {
  appRoot = projectDir;
};
