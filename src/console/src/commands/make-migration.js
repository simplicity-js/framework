"use strict";

const { GENERATE_MIGRATION_COMMAND, GENERATE_MIGRATION_HELP
} = require("../helpers/constants");
const { print } = require("../helpers/printer");
const { makeMigration } = require("../lib");
const { showHelp } = require("./helpers/command-helper");

const PADDING = "  ";

module.exports = {
  name: GENERATE_MIGRATION_COMMAND,
  handler: processMakeMigrationCommand,
  executeOnAppRootOnly: true,
};


/**
 * @param {Array} list: ordered arguments, representing positional CLI arguments
 * @param {Object} options: unordered arguments, representing named CLI options
 */
async function processMakeMigrationCommand(list, options) {
  let fields;
  let table;
  let filename;
  let database = "default";
  let type = "";
  let displayHelp = false;

  const name = Array.isArray(list) && !!list.length ? list[0] : "";
  const params = options || {};

  const MIGRATION_OPTIONS = {
    LIST: ["help", "f", "t", "n", "database", "type"],
    HELP: "help",
    FIELDS: "f",
    TABLE: "t",
    FILE_NAME: "n",
    TYPE: "type",
    DATABASE: "database",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = MIGRATION_OPTIONS.LIST.includes(o) ? o : "";

    switch(option) {
    case MIGRATION_OPTIONS.HELP:
      displayHelp = true;
      showHelp(GENERATE_MIGRATION_HELP);
      break;

    case MIGRATION_OPTIONS.FIELDS:
      fields = v?.toString().split(",");
      // ["name:string", "number:integer", "date:date", "uuid:uuid", "boolean:boolean"]
      break;

    case MIGRATION_OPTIONS.TABLE:
      table = v?.toString();
      break;

    case MIGRATION_OPTIONS.FILE_NAME:
      filename = v?.toString();
      break;

    case MIGRATION_OPTIONS.TYPE:
      type = v?.toString();
      break;

    case MIGRATION_OPTIONS.DATABASE:
      database = v?.toString();
      break;

    default:
      // console.log("no options");
      break;
    }
  });

  if(!displayHelp) {
    const suffix = name ? ` '${name}'...` : "...";

    print(`${PADDING}Generating Migration${suffix}`);

    return await makeMigration(name, { table, filename, fields, type, database, isCLI: true });
  }
}
