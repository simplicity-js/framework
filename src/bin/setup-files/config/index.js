const fs = require("node:fs");
const path = require("node:path");
const {
  freezeObject, getObjectValue, setObjectValue
} = require("../framework/lib/object");

const config = createConfigObject(__dirname, ["config.spec.js", "index.js"]);
let appConfig = config;

module.exports = freezeObject({
  get: getConfig,
  set: setConfig,
  reset: resetConfig,
});


function createConfigObject(configDir, filesToExclude = []) {
  return (fs.readdirSync(configDir)
    .filter(file => !filesToExclude.includes(file))
    .map(file => path.basename(file, ".js"))
    .reduce((config, filename) => {
      config[filename] = require(`./${filename}`);

      return config;
    }, {})
  );
}

/**
 * @param {String} path (optional): the config key to retrieve.
 *   Nested keys can be comma-separated.
 * @param {Mixed} defaultValue (optional): Value to return
 *   if no value exists for the passed key.
 * @return {Mixed}
 *
 * Usage examples:
 *   1. Get `app` config object: getConfig("app");
 *   2. Get timezone, return UTC if no timezone config found: getConfig("app.timezone", "UTC");
 */
function getConfig(path, defaultValue) {
  return getObjectValue(appConfig, path, defaultValue);
}

/**
 * Dynamically set configuration key.
 * Overwrites previous key if exists.
 *
 * @param {String} key: the config key to set.
 *   Nested keys can be comma-separated.
 * @param {Mixed}: the value to set the configuration to.
 */
function setConfig(path, value) {
  appConfig = setObjectValue(appConfig, path, value);
}

/**
 * Reset a static configuration value
 * that was dynamically changed using setConfig.
 * @param {String} key (optional): the config key to reset.
 *   Nested values can be comma-separated.
 */
function resetConfig(path) {
  if(!path) {
    appConfig = config;
  } else {
    const originalValue = getObjectValue(config, path);

    if(originalValue) {
      appConfig = setObjectValue(appConfig, path, originalValue);
    }
  }
}
