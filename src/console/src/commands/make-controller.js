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


function processMakeControllerCommand(name, cliArgs) {
  let model;
  let filename;
  let table;
  let overwrite = false;
  let isResourceController = false;
  let database = "default";
  let displayHelp = false;
  const params = cliArgs || {};

  const OPTIONS = {
    LIST: ["help", "m", "n", "t", "force", "resource", "database"],
    HELP: "help",
    MODEL: "m",
    FILE_NAME: "n",
    TABLE_NAME: "t",
    FORCE: "force",
    IS_RESOURCE_CONTROLLER: "resource",
    DATABASE: "database",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = OPTIONS.LIST.includes(o) ? o : "";

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
