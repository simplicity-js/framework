"use strict";

const { GENERATE_MIGRATION_COMMAND, GENERATE_MIGRATION_HELP
} = require("../helpers/constants");
const { makeMigration } = require("../lib");
const { showHelp } = require("./helpers/command-helper");


module.exports = {
  name: GENERATE_MIGRATION_COMMAND,
  handler: processMakeMigrationCommand,
  executeOnAppRootOnly: true,
};


/**
 * @param {Array} list: ordered arguments, representing positional CLI arguments
 * @param {Object} options: unordered arguments, representing named CLI options
 * @param {Object} logger: Object to log important messages to the console.
 *   The object provides the following methods: info, success, warn, and error.
 */
async function processMakeMigrationCommand(list, options, logger) {
  let fields;
  let table;
  let filename;
  let database = "default";
  let type = "";
  let displayHelp = false;

  const name = Array.isArray(list) && !!list.length ? list[0] : "";
  const params = options || {};

  const OPTIONS = {
    HELP: "help",
    FILE_NAME: "filename",
    FIELDS: "fields",
    ATTRIBUTES: "attributes",
    DATABASE: "database",
    TABLE: "table",
    TYPE: "type",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = Object.values(OPTIONS).includes(o) ? o : "";

    switch(option) {
    case OPTIONS.HELP:
      displayHelp = true;
      showHelp(GENERATE_MIGRATION_HELP);
      break;

    case OPTIONS.FIELDS:
    case OPTIONS.ATTRIBUTES:
      fields = v?.toString().split(",");
      // ["name:string", "number:integer", "date:date", "uuid:uuid", "boolean:boolean"]
      break;

    case OPTIONS.TABLE:
      table = v?.toString();
      break;

    case OPTIONS.FILE_NAME:
      filename = v?.toString();
      break;

    case OPTIONS.TYPE:
      type = v?.toString();
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
    const migration = await makeMigration(name, {
      table,
      filename,
      fields,
      type,
      database, isCLI: true
    });

    if(migration) {
      logger.info(`Migration [${migration}] created successfully.`);
    }
  }
}
