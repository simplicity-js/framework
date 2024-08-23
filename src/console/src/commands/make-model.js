"use strict";

const { GENERATE_MODEL_COMMAND, GENERATE_MODEL_HELP } = require(
  "../helpers/constants");
const { print } = require("../helpers/printer");
const { makeMigration, makeModel, normalizeTableName } = require("../lib");
const { ensureSimplicityApp, showHelp } = require("./helpers/command-helper");

const PADDING = "  ";

module.exports = {
  name: GENERATE_MODEL_COMMAND,
  handler: processMakeModelCommand,
};


async function processMakeModelCommand(name, cliArgs) {
  let fields;
  let table;
  let filename;
  let overwrite = false;
  let database = "default";
  let createMigration = false;
  let displayHelp = false;
  const params = cliArgs || {};

  ensureSimplicityApp(GENERATE_MODEL_COMMAND);

  const OPTIONS = {
    LIST: ["help", "fields", "t", "n", "force", "database", "migration"],
    HELP: "help",
    FIELDS: "fields",
    TABLE: "t", // table name for sequelize, collection name for mongoose
    FILE_NAME: "n",
    FORCE: "force",
    DATABASE: "database",
    MIGRATION: "migration",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = OPTIONS.LIST.includes(o) ? o : "";

    switch(option) {
    case OPTIONS.HELP:
      displayHelp = true;
      showHelp(GENERATE_MODEL_HELP);
      break;

    case OPTIONS.FIELDS:
      fields = v?.toString().split(",");
      // ["name:string", "number:integer", "date:date", "uuid:uuid", "boolean:boolean"]
      break;

    case OPTIONS.TABLE:
      table = v?.toString();
      break;

    case OPTIONS.FILE_NAME:
      filename = v?.toString();
      break;

    case OPTIONS.MIGRATION:
      createMigration = true;
      break;

    case OPTIONS.DATABASE:
      database = v?.toString().toLowerCase();
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

    print(`${PADDING}Generating Model${suffix}`);

    const retVal = await makeModel(name, { table, filename, fields, database, overwrite,
      isCLI: true,
    });

    if(createMigration) {
      const migrationName = `create-${normalizeTableName(name)}-table`
        .replace(/_/g, "-");

      makeMigration(migrationName, { table, filename, fields, database,
        model: name,
        type : "create-table",
        isCLI: true,
      });
    }

    return retVal;
  }
}
