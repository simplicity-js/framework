"use strict";

let env;
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


/**
 * Initialize the .env file in the project.
 * This method should only be called once and only from inside application/index.js
 * during the application initialization.
 */
module.exports.init = (projectDir) => {
  initializeProjectDotEnv(projectDir);

  /*
   * Rewrite the exported init so that it cannot be further invoked.
   * This prevents any accidental external calls to it from having any effect.
   */
  //initializeProjectDotEnv = null;
};

function initializeProjectDotEnv(projectDir) {
  require("dotenv").config({ path: `${projectDir}/.env` });

  env = process.env;
};
