"use strict";

const { GENERATE_CONTROLLER_COMMAND, GENERATE_CONTROLLER_HELP
} = require("../helpers/constants");
const { print } = require("../helpers/printer");
const { makeController } = require("../lib");
const { showHelp } = require("./helpers/command-helper");

const PADDING = "  ";

module.exports = {
  name: GENERATE_CONTROLLER_COMMAND,
  handler: processMakeControllerCommand,
  executeOnAppRootOnly: true,
};


/**
 * @param {Array} list: ordered arguments, representing positional CLI arguments
 * @param {Object} options: unordered arguments, representing named CLI options
 */
function processMakeControllerCommand(list, options) {
  let model;
  let filename;
  let table;
  let overwrite = false;
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
    FORCE: "force",
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

    case OPTIONS.FORCE:
      overwrite = true;
      break;

    default:
      // console.log("no options");
      break;
    }
  });

  if(!displayHelp) {
    const suffix = name ? ` '${name}'...` : "...";

    print(`${PADDING}Generating Controller${suffix}`);

    return makeController(name, { model, table, filename, database, overwrite,
      isResource: isResourceController,
      isCLI: true,
    });
  }
}
