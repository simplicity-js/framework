"use strict";

require("./node-version-check");

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const getReplaceInFile = () => import("replace-in-file").then(rif => rif);
const {
  BUILDER_NAME,
  GENERATE_CONTROLLER_COMMAND, GENERATE_MIGRATION_COMMAND,
  GENERATE_MODEL_COMMAND, GENERATE_ROUTE_COMMAND,
  MIGRATION_FOLDER_DESTINATION, MIGRATION_TYPES,
  CONTROLLER_FOLDER_DESTINATION, MODEL_FOLDER_DESTINATION, ROUTE_FOLDER_DESTINATION,
  ROUTE_TEMPLATE, RESOURCE_ROUTE_TEMPLATE, ROUTE_GROUP_TEMPLATE,
  TEMPLATES_DIR,
} = require("./helpers/constants");
const { printErrorMessage, throwLibraryError } = require("./helpers/error");
const { createDirectory, getFilename, isDirectory, normalizePath,
  pathExists, readFromFile, writeToFile
} = require("./helpers/file-system");
const {
  normalizeControllerName, normalizeFileName,
  normalizeModelName, normalizeTableName,
} = require("./helpers/normalizers");
const { print } = require("./helpers/printer");
const { singularize, upperCaseToKebabCase } = require("./helpers/string");
const overrideConsoleDotLog = require("./helpers/console-override");
const orms = require("./orms");
const { getDatabaseConfig, getMigrationFileInfo } = require(
  "./orms/helpers/database");

//const USER_ADDED_ORMS = {};
const EOL = os.EOL;
const PADDING = "  ";
//const SUPPORTED_ORMS = orms.list();

/**
 * Generator Sequelize-based Controllers, Models, Routes
 */

/**
 * @param {String} name: The controller name
 * @param {Object} options (optional)
 * @param {String} [options.model] (optional): The name of the model
 *   that will be used in the controller.
 *   Defaults to the UCFirst(CamelCase) version of the controller name.
 * @param {String} [options.table](optional):
 *   The name of the database table.
 * @param {String} [options.filename] (optional): The filename of the controller.
 *   Defaults to the kebab-case version of the controller name.
 * @param {String} [options.orm] (optional): The ORM/ODM
 *   whose model is used in the controller. Defaults to "sequelize";
 *   A folder for the ORM (whose name must be the ORM in all lowercase)
 *   must exist inside the generators/templates/ directory.
 *   and two files must be present in this folder:
 *   controller.stub and resource-controller.stub
 *   which will be used to generate the controllers for the given ORM.
 * @param {Boolean} [options.overwrite] (optional): if the controller exists, overwrite it.
 * @param {Boolean} [options.isResource](optional): is this a resource controller.
 * @return {String} the path where the controller file is stored.
 */
exports.makeController = function createController(name, options) {
  let orm;
  let { model, table, filename, database, overwrite, isResource, isCLI
  } = options || {};

  try {
    if(!name) {
      let message = "The Controller name is required.";

      if(isCLI) {
        message += ` Type ${BUILDER_NAME} ${GENERATE_CONTROLLER_COMMAND} --help for help.`;
      }

      throwLibraryError(message);
    }

    if(!database || database === "default") {
      database = "default";
      orm = getOrm(getDefaultDatabase());
    } else {
      orm = getOrm(database);
    }

    name = normalizeControllerName(name);
    model = normalizeModelName(model ?? name.replace(/-?controller/i, ""));
    table = normalizeTableName(table ?? model);
    filename  = `${normalizeFileName(filename ?? name)}.js`;

    const destinationDir = normalizeResourceFolder(CONTROLLER_FOLDER_DESTINATION);
    const destination = `${destinationDir}/${filename}`;
    const templatePath = `${TEMPLATES_DIR}/${orm}`;
    const templateFile = isResource ? "resource-controller" : "controller";
    const template = `${templatePath}/${templateFile}.stub`;

    ensureValidOrm(orm);
    ensureOrmTemplateDirectory(templatePath, orm);
    ensureTemplateFile(template, templatePath);

    const data = readFromFile(template);

    const output = data
      .replace(/\$\$CONTROLLER_NAME\$\$/gm, name)
      .replace(/\$\$MODEL_NAME\$\$/gm, model)
      .replace(/\$\$TABLE_ENTITY\$\$/gm, singularize(table));

    if(fs.existsSync(destination) && !overwrite) {
      let message = `Controller File at ${destination} already exists. `;

      if(isCLI) {
        message += "To overwrite it, use --force option.";
      } else {
        message += "To overwrite it, set the 'overwrite' option to true.";
      }

      throwLibraryError(message);
    }

    createDirectory(destinationDir);
    writeToFile(destination, output, { flag: "w" });

    const action = overwrite ? "Replaced" : "Created";

    print(`${PADDING}${action}: src > app > http > controllers > ${filename}`);
    print(`${PADDING}Controller ${destination} generated.`);

    return destination;
  } catch(err) {
    return printErrorMessage(err, `Error creating ${orm}-based controller`);
  }
};

exports.makeMigration = async function createMigration(name, options) {
  let orm;
  let migrationsDir;
  let { fields, filename, table, type, database, isCLI } = options || {};
  const types = {
    alter: /^alter(.+)table$/i,
    create: /^create(.+)table$/i,
    update: /^update(.+)table$/i
  };

  try {
    if(!name) {
      let message = "The Migration name is required.";

      if(isCLI) {
        message += ` Type ${BUILDER_NAME} ${GENERATE_MIGRATION_COMMAND} --help for help.`;
      }

      throwLibraryError(message);
    }

    if(!type) {
      type = "generic";
    }

    if(!database || database === "default") {
      database = "default";
      orm = getOrm(getDefaultDatabase());
    } else {
      orm = getOrm(database);
    }

    name = upperCaseToKebabCase(name);
    migrationsDir = getMigrationsPath(orm);

    ensureValidOrm(orm);
    ensureValidMigrationType(type);
    createDirectory(migrationsDir);
    ensureUniqueMigrationName(name, migrationsDir);

    for(const [action, regex] of Object.entries(types)) {
      const matches = name.match(regex);

      if(matches) {
        type = `${action}-table`;

        if(!table) {
          table = matches[1].replace(/(^[_-]+|[_-]+$)/, "");
        }

        break;
      }
    }

    const supportedOrms = getSupportedOrms();
    const createNewMigration = supportedOrms[orm].createMigration;

    if(typeof createNewMigration === "function") {
      return await createNewMigration(name, {
        fields,
        filename,
        table,
        type,
      });
    } else {
      throwLibraryError(
        `No migration function found for ORM '${orm}'. ` +
        "Kindly specify another ORM."
      );
    }
  } catch(err) {
    return printErrorMessage(err, `Error creating ${orm}-based migration`);
  }
};

/**
 * @param {String} name: The model name
 * @param {Object} options
 * @param {String} [options.table](optional): The name of the database table.
 * @param {String} [options.filename] (optional): The filename of the model.
 *   Defaults to the kebab-case version of the model name.
 * @param {Array} fields (optional):
 *   An array of string "key:value" pairs entered on the CLI. For example:
 *   ["name:string", "number:integer", "date:date", "uuid:uuid", "boolean:boolean"]
 *   for the corresponding data type for the given ORM.
 * @param {String} [options.orm] (optional): The ORM/ODM
 *   used in interacting with the model. Defaults to "sequelize";
 *   A folder for the ORM (whose name must be the ORM in all lowercase)
 *   must exist inside the generators/templates/ directory.
 *   and the file named 'model.stub' must be present in this folder.
 *   It will be used to generate the models for the given ORM.
 * @param {Boolean} [options.overwrite] (optional): if the model exists, overwrite it.
 * @param {Boolean} [options.isCLI] (optional):
 *   whether the function is invoked from the CLI or programatically from a file.
 * @return {String} the path where the model file is stored.
 */
exports.makeModel = async function createModel(name, options) {
  let orm;
  let { table, filename, fields, database, overwrite, isCLI
  } = options || {};

  try {
    if(!name) {
      let message = "The Model name is required.";

      if(isCLI) {
        message += ` Type ${BUILDER_NAME} ${GENERATE_MODEL_COMMAND} --help for help.`;
      }

      throwLibraryError(message);
    }

    if(!database || database === "default") {
      database = "default";
      orm = getOrm(getDefaultDatabase());
    } else {
      orm = getOrm(database);
    }

    ensureValidOrm(orm);

    const templatePath = `${TEMPLATES_DIR}/${orm}`;

    ensureOrmTemplateDirectory(templatePath, orm);

    const template = `${templatePath}/model.stub`;

    ensureTemplateFile(template, templatePath);

    name = normalizeModelName(name);
    table = normalizeTableName(table ?? name);
    filename = `${filename ?? normalizeFileName(name)}.js`;


    const destinationDir = normalizeResourceFolder(MODEL_FOLDER_DESTINATION) + `/${orm.toLowerCase()}`;
    const destination = `${destinationDir}/${filename}`;


    const supportedOrms = getSupportedOrms();
    const modelFields = await supportedOrms[orm].parseModelFields(fields) ?? "";
    const data = readFromFile(template);
    const output = data
      .replace(/\$\$MODEL_NAME\$\$/gm, name)
      .replace(/\$\$CONNECTION\$\$/gm, database)
      .replace(/\$\$(COLLECTION|TABLE)_NAME\$\$/gm, table)
      .replace(/\$\$MODEL_FIELDS\$\$/gm, modelFields);

    // -a option
    // output = output.replace("$$MODEL_ASSOCIATION$$", ASSOCITION_OPTION);

    if(fs.existsSync(destination) && !overwrite) {
      let message = `Model File at ${destination} already exists. `;

      if(isCLI) {
        message += "To overwrite it, use --force option.";
      } else {
        message += "To overwrite it, set the 'overwrite' option to true.";
      }

      throwLibraryError(message);
    }

    createDirectory(destinationDir);
    writeToFile(destination, output, { flag: "w" });

    const action = overwrite ? "Replaced" : "Created";

    print(`${PADDING}${action}: src > app > http > models > ${orm} > ${filename}`);
    print(`${PADDING}Model ${destination} generated.`);

    return destination;
  } catch(err) {
    return printErrorMessage(err, `Error creating ${orm}-based model`);
  }
};

exports.makeRoute = async function createRoute(name, options) {
  let controllerFilename;
  let { controllerName, isApiRoute, isResourceRoute, overwrite, isCLI
  } = options || {};

  try {
    if(!name) {
      let message = "The Route name is required.";

      if(isCLI) {
        message += ` Type ${BUILDER_NAME} ${GENERATE_ROUTE_COMMAND} --help for help.`;
      }

      throwLibraryError(message);
    }

    controllerName = normalizeControllerName(controllerName || name);
    controllerFilename = getFilename(upperCaseToKebabCase(controllerName), false);

    let destinationPrefix = isApiRoute ? "api" : "web";
    let routeFolder = `${normalizeResourceFolder(ROUTE_FOLDER_DESTINATION)}/`;

    routeFolder += (isResourceRoute ? "web" : destinationPrefix);

    // If the user has renamed the (web|api).js file to a folder
    // where they store each individual route as a separate file,
    // then create this route as a stand-alone file inside the appropriate directory.
    if(isDirectory(routeFolder)) {
      let output;
      const filename = `${name.toLowerCase()}.js`;
      const TEMPLATE_FILE = isResourceRoute
        ? RESOURCE_ROUTE_TEMPLATE
        : ROUTE_TEMPLATE;

      const destination = `${routeFolder}/${filename}`;
      const data = readFromFile(TEMPLATE_FILE);

      output = data
        .replace(/\$\$CONTROLLER_FILE_NAME\$\$/gm, controllerFilename)
        .replace(/\$\$CONTROLLER_NAME\$\$/gm, controllerName);

      if(isResourceRoute) {
        output = output.replace(/\$\$RESOURCE\$\$/gm, name);
      } else {
        output = output.replace(/\$\$ROUTE\$\$/gm, name);
        //.replace(/\$\$CONTROLLER_OBJECT\$\$/gm, LCFirst(controllerName));
      }

      if(fs.existsSync(destination) && !overwrite) {
        let message = `Route File at ${destination} already exists. `;

        if(isCLI) {
          message += "To overwrite it, use --force option.";
        } else {
          message += "To overwrite it, set the 'overwrite' option to true.";
        }

        throwLibraryError(message);
      }

      writeToFile(destination, output, { flag: "w" });

      const action = overwrite ? "Replaced" : "Created";

      print(`${PADDING}${action}: src > routes > ${getFilename(routeFolder)} > ${filename}`);
      print(`${PADDING}Route ${destination} generated.`);

      return destination;
    } else {
      let output;
      //const controllerObject = LCFirst(controllerName);

      if(isResourceRoute) {
        destinationPrefix = "web";
        output = `router.resource("${name}", ${controllerName});`;
      } else {
        output = readFromFile(ROUTE_GROUP_TEMPLATE)
          .replace(/\$\$CONTROLLER_NAME\$\$/gm, controllerName)
          .replace(/\$\$BASE_PATH\$\$/gm, name)
          .trim();
      }

      const filename = `${destinationPrefix}.js`;
      const destination = `${normalizeResourceFolder(ROUTE_FOLDER_DESTINATION)}/${filename}`;
      const replacer = await getReplaceInFile();

      await replacer.replaceInFile({
        files: [destination],
        from: [
          "const router = Router.router();",
          "module.exports = router;"
        ],
        to: [
          [
            `const ${controllerName} = require("../app/http/controllers/${controllerFilename}");${EOL}`,
            //`const ${controllerObject} = new ${controllerName}();`,
            "const router = Router.router();"
          ].join(""),
          [
            `${output}${EOL}${EOL}`,
            "module.exports = router;"
          ].join("")
        ]
      });

      print(`${PADDING}Route information written to: src > routes > ${filename}`);

      return output;
    }
  } catch (err) {
    return printErrorMessage(err, `Error creating route '${name}'`);
  }
};

/**
 * @param {Object} options
 * @param {String} [options.database]:
 *   The database engine to use when the 'orm' value is sequelize.
 *   Supported values are: mariadb|memory|mysql|postgres|sqlite.
 * @param {Boolean} [options.rollback]: If true, rollback the last (N) migrations.
 * @param {Number} [options.step]: The number of migrations to rollback.
 *   Currently only works for sequelize ORM.
 * @param {Boolean} [options.reset]: If true, rollback your entire migrations.
 *   Currently only works for sequelize ORM.
 * @param {Boolean} [options.isCLI]
 */
exports.migrate = async function migrate(options) {
  let { database, rollback, step, reset } = options || {};
  const promises = [];
  const supportedOrms = getSupportedOrms();
  const operation = rollback ? "rollback" : "migrate";

  try {
    const dbConfig = getDatabaseConfig();
    const databases = Object.keys(dbConfig.connections);

    if(database === "default") {
      database = getDefaultDatabase();
      enqueueDatabaseMigration(database);
    } else if(database && databases.includes(database)) {
      enqueueDatabaseMigration(database);
    } else {
      databases.forEach(enqueueDatabaseMigration);
    }

    // Suppress the output from the migration libraries we are using.
    // This will enable us declutter the user's output screen
    // and output our own custom message instead.
    const logFile = path.join(path.dirname(__dirname), ".logs", "console.log");
    const restoreConsoleLog = overrideConsoleDotLog(logFile);
    const data = await Promise.all(promises);;
    restoreConsoleLog();

    return data;

  } catch(err) {
    return printErrorMessage(err, "Error applying migrations");
  }

  function enqueueDatabaseMigration(database) {
    const orm = getOrm(database);

    ensureValidOrm(orm);

    const fn = supportedOrms[orm][operation];

    promises.push(fn({ database, step, reset }));
  }
};

/**
 * @param {Object} orms object whose keys are the orm keys,
 * and whose values should be objects with members:
 *   - parseModelFields (Function): takes an array of fields and returns an object.
 *   - createMigration (Function): takes a name and an options object,
 *        and creates a migration inside the
 *        `src/database/migrations/<ORM_KEY>/` directory
 *        of the current (aka app) directory.
 *  - migrate (Function)
 *  - rollback (Function)
 */
exports.setAdditionalOrms = function setSupportedOrms(additionalOrms) {
  for(const [key, value] of Object.entries(additionalOrms)) {
    /*if(!(key in USER_ADDED_ORMS)) {
      USER_ADDED_ORMS[key] = value;
    }*/

    orms.register({ ...value, name: key });
  }
};

/**
 * @param {Array|String} (optional):
 * List, comma-separated, space-separated, or semi-colon (;) separated
 * string of  user-added ORMs to remove. If no list is passed,
 * every user-added ORM is removed from the supported ORMs
 */
exports.clearAdditionalOrms = function clearAdditionalOrms(ormNames) {
  if(typeof ormNames === "string") {
    ormNames = ormNames.split(/[\s+,;]+/).map(o => o.trim());
  }

  if(!Array.isArray(ormNames)) {
    ormNames = []; //Object.keys(USER_ADDED_ORMS);
  }

  for(const orm of ormNames) {
    /*if(orm in USER_ADDED_ORMS) {
      delete USER_ADDED_ORMS[orm];
    }*/

    orms.deregister(orm);
  }
};

exports.getDatabaseConnection = async function getDatabaseConnection(database) {
  if(!database || database === "default") {
    database = getDefaultDatabase();
  }

  return await (getOrm(database, true).getDatabaseConnection(database));
};

exports.getSupportedOrms = getSupportedOrms;
exports.normalizeTableName = normalizeTableName;
exports.printErrorMessage = printErrorMessage;
exports.throwLibraryError = throwLibraryError;

function ensureOrmTemplateDirectory(templatePath, orm) {
  if(!isDirectory(templatePath)) {
    throwLibraryError(
      `The '${orm}' directory does not exist. ` +
      `Kindly create it inside the ${TEMPLATES_DIR} directory.`
    );
  }
}

function ensureTemplateFile(template, templatePath) {
  if(!pathExists(template)) {
    throwLibraryError(
      `Template file '${getFilename(template, true)}' not found. ` +
      `No such file exists inside the ${templatePath} directory.`
    );
  }
}

function ensureUniqueMigrationName(name, migrationsDir) {
  const migrationFileInfo = getMigrationFileInfo(name, migrationsDir);
  const migrationName = migrationFileInfo.migrationName;

  if(migrationName.toLowerCase() === name.toLowerCase()) {
    throwLibraryError(
      `Migration '${migrationName}' already exists. Kindly use a different name.`
    );
  }
}

function ensureValidMigrationType(type) {
  if(!MIGRATION_TYPES.includes(type)) {
    throwLibraryError(
      `Invalid migration type '${type}' specified. ` +
      `Valid migration types include ${MIGRATION_TYPES.join(", ")}.`
    );
  }
}

function ensureValidOrm(orm) {
  const supportedOrms = getSupportedOrms();
  const validOrms = Object.keys(supportedOrms);
  const opt = "'orm'";
  const ormAPI = [
    "createMigration",
    "migrate",
    "rollback",
    "parseModelFields",
    "getDatabaseConnection",
    "databases"
  ];

  if(!validOrms.includes(orm?.toLowerCase())) {
    throwLibraryError(
      `Invalid value '${orm}' for option ${opt}. ` +
      `Valid values are ${validOrms.join(" and ")}.`
    );
  }

  const targetOrm = supportedOrms[orm];

  for(const api of ormAPI) {
    let shouldThrow = false;
    let missingStr;

    if(api === "databases") {
      if(!Array.isArray(targetOrm[api])) {
        shouldThrow = true;
        missingStr = "array";
      }
    } else {
      if(typeof targetOrm[api] !== "function") {
        shouldThrow = true;
        missingStr = "method";
      }
    }

    if(shouldThrow) {
      throwLibraryError(
        `Missing ${missingStr} '${api}' on '${orm}' for option ${opt}.`
      );
    }
  }
}

function getDefaultDatabase() {
  return getDatabaseConfig("default");
}

function getMigrationsPath(orm) {
  let path = normalizeResourceFolder(MIGRATION_FOLDER_DESTINATION);
  path += orm ? `/${orm}` : "";

  return path;
}

/**
 * @param {Boolean} fullObject
 * If true, return the entire ORM object.
 * Otherwise, just return it's key/name such as: "mongoose", "sequelize", etc.
 */
function getOrm(database, fullObject) {
  const supportedOrms = getSupportedOrms();

  for(const orm of Object.keys(supportedOrms)) {
    if(supportedOrms[orm].databases?.includes(database)) {
      return (!!fullObject ? supportedOrms[orm] : orm);
    }
  }
}

function getSupportedOrms() {
  return orms.list(); //{ ...SUPPORTED_ORMS, ...USER_ADDED_ORMS };
}

function normalizeResourceFolder(folder) {
  return normalizePath(`${process.cwd()}/${folder}`);
}
