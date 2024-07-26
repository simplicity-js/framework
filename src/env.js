const env = require("./dotenv");

const specialTypes = {
  "false" : false,
  "true"  : true,
  "empty" : "",
  "null"  : null
};


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
  let val = env[name] ?? defaultValue;

  for(const type of Object.keys(specialTypes)) {
    if(String(val).trim().match(new RegExp(`^\\(?${type}\\)?$`))) {
      val = specialTypes[type];
    }
  }

  return val;
};
