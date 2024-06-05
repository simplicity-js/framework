const fs = require("node:fs");
const path = require("node:path");
const is = require("../helpers/is");
const { deepClone } = require("../helpers/object");

const config = createConfigObject(__dirname);
let appConfig = deepClone(config);

module.exports = Object.freeze({
  get: getConfig,
  set: setConfig,
  reset: resetConfig,
});


function createConfigObject(configDir) {
  const config = {};
  const configFiles = fs.readdirSync(configDir);
  const exclusionFiles = ["config.spec", "index"];

  for(let i = 0, len = configFiles.length; i < len; i++) {
    const filename = path.basename(configFiles[i], ".js");

    if(exclusionFiles.includes(filename)) {
      continue;
    }

    config[filename] = require(`./${filename}`);
  }

  return config;
}

/**
 * @param {String} path (optional): the config key to retrieve.
 *   Nested keys can be comma-separated.
 * @param {Mixed} defaultValue (optional): Value to return
 *   if no value exists for the passed key.
 * @return {Mixed}
 *
 * Usage examples:
 *   1. Get `app` config object: config("app");
 *   2. Get timezone, return UTC if no timezone config found: config("app.timezone", "UTC");
 */
function getConfig(path, defaultValue) {
  return getObjectValue(appConfig, path, defaultValue);
}

function getObjectValue(obj, path, defaultValue) {
  // Cf. https://stackoverflow.com/q/54733539/1743192
  // See also: https://stackoverflow.com/a/6491621/1743192
  return path.split(".").reduce(function getObjectValueViaPath(a, c) {
    return (a && a[c] ? a[c] : defaultValue);
  }, obj);
}

/**
 * Dynamically set configuration key.
 * Overwrites previous key if exists.
 *
 * @param {String} key: the config key to set.
 *   Nested keys can be comma-separated.
 * @param {Mixed}: the value to set te configuration to.
 */
function setConfig(path, value) {
  appConfig = setObjectValue(appConfig, path, value);
}

function setObjectValue(obj, path, value) {
  // Credits: https://stackoverflow.com/a/65072147/1743192
  const paths = path.split(".");
  const inputObj = is.object(obj) ? { ...obj } : {};

  if(paths.length === 1) {
    inputObj[paths[0]] = value;

    return inputObj;
  }

  const [currPath, ...rest] = paths;
  const currentNode = inputObj[currPath];
  const childNode = set(currentNode, rest, value);

  inputObj[currPath] = childNode;

  return inputObj;
};

/**
 * Reset a static configuration value
 * that was dynamically changed using setConfig.
 * @param {String} key (optional): the config key to reset.
 *   Nested values can be comma-separated.
 */
function resetConfig(path) {
  if(!path) {
    appConfig = deepClone(config);
  } else {
    const originalValue = getObjectValue(config, path);

    if(originalValue) {
      appConfig = setObjectValue(appConfig, path, originalValue);
    }
  }
}
