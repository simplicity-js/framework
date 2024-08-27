let appRoot;


module.exports = function storagePath(location) {
  return `${appRoot}/storage` + location ? `/${location}` : "";
};

/**
 * Initialize the storagePath method in the project.
 * This method should only be called once and only from inside application/index.js
 * during the application initialization.
 */
module.exports.init = function initializeStoragePath(projectDir) {
  appRoot = projectDir;

  /*
   * Rewrite the exported init so that it cannot be further invoked.
   * This prevents any accidental calls to it from having any effect.
   */
  module.exports.init = null;
};
