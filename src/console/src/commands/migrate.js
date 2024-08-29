"use strict";

const { RUN_MIGRATION_COMMAND, RUN_MIGRATION_HELP } = require(
  "../helpers/constants");
const { migrate } = require("../lib");
const { showHelp } = require("./helpers/command-helper");

module.exports = {
  name: RUN_MIGRATION_COMMAND,
  handler: processMigrateCommand,
  executeOnAppRootOnly: true,
};


/**
 * @param {Array} list: ordered arguments, representing positional CLI arguments
 * @param {Object} options: unordered arguments, representing named CLI options
 * @param {Object} logger: Object to log important messages to the console.
 *   The object provides the following methods: info, success, warn, and error.
 */
async function processMigrateCommand(_, options, logger) {
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
    const data = await migrate({ database, rollback, step, reset });

    if(data) {
      logger.info("Migrations applied successfully.");
    }
  }

  return 0;
}
