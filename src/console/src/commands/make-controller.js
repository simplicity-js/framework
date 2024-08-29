"use strict";

const { GENERATE_CONTROLLER_COMMAND, GENERATE_CONTROLLER_HELP
} = require("../helpers/constants");
const { makeController } = require("../lib");
const { showHelp } = require("./helpers/command-helper");

module.exports = {
  name: GENERATE_CONTROLLER_COMMAND,
  handler: processMakeControllerCommand,
  executeOnAppRootOnly: true,
};


/**
 * @param {Array} list: ordered arguments, representing positional CLI arguments
 * @param {Object} options: unordered arguments, representing named CLI options
 * @param {Object} logger: Object to log important messages to the console.
 *   The object provides the following methods: info, success, warn, and error.
 */
function processMakeControllerCommand(list, options, logger) {
  let model;
  let filename;
  let table;
  let isResourceController = false;
  let database = "default";
  let displayHelp = false;

  const name = Array.isArray(list) && !!list.length ? list[0] : "";
  const params = options || {};

  const OPTIONS = {
    HELP: "help",
    FILE_NAME: "filename",
    MODEL: "model",
    DATABASE: "database",
    TABLE_NAME: "table",
    IS_RESOURCE_CONTROLLER: "resource",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = Object.values(OPTIONS).includes(o) ? o : "";

    switch(option) {
    case OPTIONS.HELP:
      displayHelp = true;
      showHelp(GENERATE_CONTROLLER_HELP);
      break;

    case OPTIONS.MODEL:
      model = v?.toString();
      break;

    case OPTIONS.FILE_NAME:
      filename = v?.toString();
      break;

    case OPTIONS.IS_RESOURCE_CONTROLLER:
      isResourceController = true;
      break;

    case OPTIONS.TABLE_NAME:
      table = v?.toString();
      break;

    case OPTIONS.DATABASE:
      database = v?.toString();
      break;

    default:
      // console.log("no options");
      break;
    }
  });

  if(!displayHelp) {
    const controller = makeController(name, { model, table, filename, database,
      isResource: isResourceController,
      isCLI: true,
    });

    if(controller) {
      logger.info(`Controller [${controller}] created successfully.`);
    }
  }

  return 0;
}
