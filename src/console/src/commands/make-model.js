"use strict";

const { GENERATE_MODEL_COMMAND, GENERATE_MODEL_HELP } = require(
  "../helpers/constants");
const { makeMigration, makeModel, normalizeTableName } = require("../lib");
const { showHelp } = require("./helpers/command-helper");


module.exports = {
  name: GENERATE_MODEL_COMMAND,
  handler: processMakeModelCommand,
  executeOnAppRootOnly: true,
};


/**
 * @param {Array} list: ordered arguments, representing positional CLI arguments
 * @param {Object} options: unordered arguments, representing named CLI options
 * @param {Object} logger: Object to log important messages to the console.
 *   The object provides the following methods: info, success, warn, and error.
 */
async function processMakeModelCommand(list, options, logger) {
  let fields;
  let table;
  let filename;
  let database = "default";
  let createMigration = false;
  let displayHelp = false;

  const name = Array.isArray(list) && !!list.length ? list[0] : "";
  const params = options || {};

  const OPTIONS = {
    HELP: "help",
    FILE_NAME: "filename",
    FIELDS: "fields",
    ATTRIBUTES: "attributes",
    MIGRATION: "migration",
    DATABASE: "database",
    TABLE: "table", // table name for sequelize, collection name for mongoose
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = Object.values(OPTIONS).includes(o) ? o : "";

    switch(option) {
    case OPTIONS.HELP:
      displayHelp = true;
      showHelp(GENERATE_MODEL_HELP);
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

    case OPTIONS.MIGRATION:
      createMigration = true;
      break;

    case OPTIONS.DATABASE:
      database = v?.toString().toLowerCase();
      break;

    default:
      // console.log("no options");
      break;
    }
  });

  if(!displayHelp) {

    const model = await makeModel(name, {
      table,
      filename,
      fields,
      database,
      isCLI: true,
    });

    if(model) {
      let migration;

      if(createMigration) {
        const migrationName = `create-${normalizeTableName(name)}-table`
          .replace(/_/g, "-");

        migration = await makeMigration(migrationName, {
          table,
          filename,
          fields,
          database,
          model: name,
          type : "create-table",
          isCLI: true,
        });
      }

      logger.info(`Model [${model}] created successfully.`);

      if(migration) {
        logger.info(`Migration [${migration}] created successfully.`);
      }
    }
  }

  return 0;
}
