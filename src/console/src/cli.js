#!/usr/bin/env node

"use strict";

require("./node-version-check");

const { getArgs } = require("./helpers/cli");
const { pathExists, readLinesFromFile } = require("./helpers/file-system");
const { print, marker } = require("./helpers/printer");
const {
  GENERATE_COMMAND, GENERATE_CONTROLLER_COMMAND, GENERATE_MODEL_COMMAND,
  GENERATE_MIGRATION_COMMAND, GENERATE_ROUTE_COMMAND,
  GENERATE_HELP, GENERATE_CONTROLLER_HELP, GENERATE_MIGRATION_HELP,
  GENERATE_MODEL_HELP, GENERATE_ROUTE_HELP,
  MANUAL_HELP, RUN_MIGRATION_COMMAND, RUN_MIGRATION_HELP
} = require("./helpers/constants");

const {
  makeController, makeMigration, makeModel, makeRoute, migrate,
  normalizeTableName, printErrorMessage, throwLibraryError
} = require("./lib");

const cwd = process.cwd().replace(/\\/g, "/");
const { values: params, positionals: list } = getArgs();
const PARAMETER_1 = list[0];
const PARAMETER_2 = list[1];
const PADDING = "  ";

function ensureSimplicityApp(command) {
  if(!isSimplicityApp(cwd)) {
    throwLibraryError(
      `'simplicity ${command}' can only be run ` +
      "from within a Simplicity application directory."
    );
  }
}

/**
 * Determine if the given directory is a Simplicity application directory.
 */
function isSimplicityApp(projectDir) {
  const packageDotJsonFile = `${projectDir}/package.json`;

  if(!pathExists(packageDotJsonFile)) {
    return false;
  }

  const pkg = require(packageDotJsonFile);
  const deps = Object.keys(pkg?.dependencies || {});

  if(!deps.includes("@simplicityjs/framework")) {
    return false;
  }

  if(!pathExists(`${projectDir}/src/app/http`)) {
    return false;
  }

  return true;
}

async function showHelp(target) {
  print();

  try {
    const lines = await readLinesFromFile(target);

    for await(const line of lines) {
      print(`${PADDING}${line}`);
    }
  } catch(e) {
    console.log(e);
  }
}

function showVersionInfo() {
  print(
    `${PADDING}${marker.success.text("Simplicity")}${` version ${require("../package").version} (cli)`}`
  );

  if(isSimplicityApp(cwd)) {
    print(`${PADDING}Framework version ${require(`${cwd}/package`).version}`);
  }
}

function processMakeControllerCommand(name) {
  let model;
  let filename;
  let table;
  let overwrite = false;
  let isResourceController = false;
  let database = "default";
  let displayHelp = false;

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

    makeController(name, { model, table, filename, database, overwrite,
      isResource: isResourceController,
      isCLI: true,
    });
  }
}

async function processMakeMigrationCommand(name) {
  let fields;
  let table;
  let filename;
  let database = "default";
  let type = "";
  let displayHelp = false;

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

    makeMigration(name, { table, filename, fields, type, database, isCLI: true });
  }
}

async function processMakeModelCommand(name) {
  let fields;
  let table;
  let filename;
  let overwrite = false;
  let database = "default";
  let createMigration = false;
  let displayHelp = false;

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

    await makeModel(name, { table, filename, fields, database, overwrite,
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
  }
}

function processMakeRouteCommand(name) {
  let controller;
  let isApiRoute = false;
  let isResourceRoute = false;
  let overwrite = false;
  let displayHelp = false;

  const ROUTE_OPTIONS = {
    LIST: ["help", "api", "c", "force", "resource"],
    HELP: "help",
    CONTROLLER_NAME: "c",
    IS_API_ROUTE: "api",
    FORCE: "force",
    IS_RESOURCE_ROUTE: "resource",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = ROUTE_OPTIONS.LIST.includes(o) ? o : "";

    switch(option) {
    case ROUTE_OPTIONS.HELP:
      displayHelp = true;
      showHelp(GENERATE_ROUTE_HELP);
      break;

    case ROUTE_OPTIONS.CONTROLLER_NAME:
      controller = v?.toString();
      break;

    case ROUTE_OPTIONS.IS_API_ROUTE:
      isApiRoute = true;
      break;

    case ROUTE_OPTIONS.IS_RESOURCE_ROUTE:
      isResourceRoute = true;
      break;

    case ROUTE_OPTIONS.FORCE:
      overwrite = true;
      break;

    default:
      // console.log("no options");
      break;
    }
  });

  if(!displayHelp) {
    const suffix = name ? ` '${name}'...` : "...";

    print(`${PADDING}Generating Route${suffix}`);

    makeRoute(name, { controller, isApiRoute, isResourceRoute, overwrite,
      isCLI: true,
    });
  }
}

async function processMigrateCommand() {
  let rollback = false;
  let step = 0;
  let reset = false;
  let database = ""; // The database engine.
  let displayHelp = false;

  const OPTIONS = {
    LIST: ["help", "database", "reset", "rollback", "step"],
    HELP: "help",
    DATABASE: "database",
    RESET: "reset",
    ROLLBACK: "rollback",
    STEP: "step",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = OPTIONS.LIST.includes(o) ? o : "";

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

    migrate({ database, rollback, step, reset });
  }
}

function main(c) {
  const COMMAND_LIST = [
    "help", "version",
    GENERATE_COMMAND, `${GENERATE_COMMAND}:`,
    GENERATE_CONTROLLER_COMMAND, GENERATE_MODEL_COMMAND,
    GENERATE_MIGRATION_COMMAND, GENERATE_ROUTE_COMMAND,
    RUN_MIGRATION_COMMAND
  ];

  const COMMANDS = {
    HELP            : "help",
    VERSION         : "version",
    MAKE            : GENERATE_COMMAND,
    MAKE_           : `${GENERATE_COMMAND}:`,
    MAKE_CONTROLLER : GENERATE_CONTROLLER_COMMAND,
    MAKE_MODEL      : GENERATE_MODEL_COMMAND,
    MAKE_MIGRATION  : GENERATE_MIGRATION_COMMAND,
    MAKE_ROUTE      : GENERATE_ROUTE_COMMAND,
    MIGRATE         : RUN_MIGRATION_COMMAND,
  };

  const command = COMMAND_LIST.includes(c) ? c : "";

  try {
    switch(command) {
    case COMMANDS.HELP:
      showHelp(MANUAL_HELP);
      break;

    case COMMANDS.VERSION:
      showVersionInfo();
      break;

    case COMMANDS.MAKE:
    case COMMANDS.MAKE_:
      showHelp(GENERATE_HELP);
      break;

    case COMMANDS.MAKE_CONTROLLER:
      ensureSimplicityApp(GENERATE_CONTROLLER_COMMAND);
      processMakeControllerCommand(PARAMETER_2);
      break;

    case COMMANDS.MAKE_MODEL:
      ensureSimplicityApp(GENERATE_MODEL_COMMAND);
      processMakeModelCommand(PARAMETER_2);
      break;

    case COMMANDS.MAKE_MIGRATION:
      ensureSimplicityApp(GENERATE_MIGRATION_COMMAND);
      processMakeMigrationCommand(PARAMETER_2);
      break;

    case COMMANDS.MAKE_ROUTE:
      ensureSimplicityApp(GENERATE_ROUTE_COMMAND);
      processMakeRouteCommand(PARAMETER_2);
      break;

    case COMMANDS.MIGRATE:
      ensureSimplicityApp(RUN_MIGRATION_COMMAND);
      processMigrateCommand();
      break;

    default:
      if(command) {
        print(
          `${PADDING}ERROR: Unkown Command '${command}' pls refer to --help.`
        );
      }

      if(params.version) {
        showVersionInfo();
      } else {
        showHelp(MANUAL_HELP);
      }
    }
  } catch(err) {
    printErrorMessage(err);
  }
}

/**
 *  Start of main
 */
main(PARAMETER_1);
