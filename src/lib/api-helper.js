"use strict";

const fs = require("node:fs");
const path = require("node:path");


/**
 * Generates an extendable API (a plugin interface) from a set of files inside a directory.
 * Each eligible file must expose/export an object with a required 'name' property
 * and any other members (of any type) they want to be part of the generated
 * API interface. The function then returns an object with members:
 *   - register: a function that allows clients to register custom APIs
 *       that conform to the API interface of the core APIs.
 *   - deregister: a function that takes the name of a previously registered
 *       custom API and removes it from the API interface.
 *   - list: A function that lists the available APIs (core and custom)
 *   - isCore: A function that takes a name and returns true if it's a core API name.
 *   - isPlugin: A function that takes a name and returns true if it's a plugin name.
 * @param {Object} config
 * @param {String} [config.src] (required): The source directory housing the core API files
 * @param {String[]} [config.skip] (optional): An array of files in the directory
 *   that should not be part of the API. The file extensions of these files
 *   should be omitted.
 * @param {Function} [config.validator] (optional): A function to validate
 *   custom plugins to ensure they meet the minimum required interface specs
 *   for the API before being allowed to be registered.
 *   The function receives the plugin that's about to be registered as argument.
 *   The function must return the boolean literal true if the plugin meets the requirements.
 *   It should throw an appropriate error or return false otherwise.
 *
 * Pro Tip:
 *   To create a plugin interface without any core API,
 *   just pass in an empty directory as as the first argument.
 */
exports.createPluginInterface = function generateExtendableApi(config) {
  const { src: apiDir, skip: filesToSkip, validator } = config || {};

  const coreApi = {};
  const plugins = {};
  const currDir = apiDir.replace(/\\/g, "/");
  const coreApiFiles = fs.readdirSync(currDir);
  const validate = typeof validator === "function" ? validator : () => true;

  for(let i = 0; i < coreApiFiles.length; i++) {
    const filename = path.basename(coreApiFiles[i], ".js");

    if(filesToSkip.includes(filename)) {
      continue;
    } else {
      const api = require(`${currDir}/${filename}`);

      coreApi[api.name] = api;
    }
  }

  return {
    register(api) {
      if(validate(api) === true) {
        plugins[api.name] = api;
      }
    },
    deregister(name) {
      delete plugins[name];
    },
    list(options) {
      let val = {};
      const { core, plugins: pluggedin } = options || {};

      if(core) {
        val = { ...coreApi };
      } else if(pluggedin) {
        val = { ...plugins };
      } else {
        val = {...coreApi, ...plugins };
      }

      return val;
    },
    isCore(name) {
      return Object.keys(coreApi).includes(name);
    },
    isPlugin(name) {
      return Object.keys(plugins).includes(name);
    }
  };
};
