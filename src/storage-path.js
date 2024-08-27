let appRoot;


module.exports = function storagePath(location) {
  return `${appRoot}/storage/${location ?? ""}`;
};

/**
 * Initialize the storagePath method in the project.
 * This method should only be called once and only from inside application/index.js
 * during the application initialization.
 */
module.exports.init = function initializeStoragePath(projectDir) {
  appRoot = projectDir;
};
