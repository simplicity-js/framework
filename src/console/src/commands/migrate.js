"use strict";

const { RUN_MIGRATION_COMMAND, RUN_MIGRATION_HELP } = require(
  "../helpers/constants");
const { print } = require("../helpers/printer");
const { migrate } = require("../lib");
const { showHelp } = require("./helpers/command-helper");

const PADDING = "  ";

module.exports = {
  name: RUN_MIGRATION_COMMAND,
  handler: processMigrateCommand,
  executeOnAppRootOnly: true,
};


/**
 * @param {Array} list: ordered arguments, representing positional CLI arguments
 * @param {Object} options: unordered arguments, representing named CLI options
 */
async function processMigrateCommand(_, options) {
  let rollback = false;
  let step = 0;
  let reset = false;
  let database = ""; // The database engine.
  let displayHelp = false;

  const params = options || {};

  const OPTIONS = {
    HELP: "help",
    ROLLBACK: "rollback",
    STEP: "step",
    RESET: "reset",
    DATABASE: "database",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = Object.values(OPTIONS).includes(o) ? o : "";

    switch(option) {
    case OPTIONS.HELP:
      displayHelp = true;
      showHelp(RUN_MIGRATION_HELP);
      break;

    case OPTIONS.DATABASE:
      database = v?.toString();
      break;

    case OPTIONS.RESET:
      reset = true;
      break;

    case OPTIONS.ROLLBACK:
      rollback = true;
      break;

    case OPTIONS.STEP:
      step = parseInt(v?.toString(), 10);
      break;

    default:
      // console.log("no options");
      break;
    }
  });

  if(!displayHelp) {
    print(`${PADDING}Running migrations...`);

    return await migrate({ database, rollback, step, reset });
  }
}
