const env = require("./dotenv");


/**
 * Read an environment variable value if set.
 * If not set, return a default value if set.
 * Otherwise, return undefined.
 *
 * @param {String} name: The environment variable name to read.
 * @param {Mixed} defaultValue (optional): the value to return
 *   if the name is not set in the environment.
 */
module.exports = function getEnv(name, defaultValue) {
  return env[name] ?? defaultValue;
};
