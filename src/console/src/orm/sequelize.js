const { Sequelize } = require("sequelize");
const { MIGRATION_FOLDER_DESTINATION, SEQUELIZE_DATA_TYPES, TEMPLATES_DIR
} = require("../helpers/constants");
const { printErrorMessage, throwLibraryError } = require("../helpers/error");
const { readFromFile, writeToFile } = require("../helpers/file-system");
const { normalizeFileName, normalizeTableName } = require(
  "../helpers/normalizers");
const { print} = require("../helpers/printer");
const { getDatabaseOptions } = require("./helpers/database");
const createSequelizeMigrator = require("./helpers/sequelize-migrator");

const getMigrationsPath = () => `${process.cwd().replace(/\\/g, "/")}/${MIGRATION_FOLDER_DESTINATION}/sequelize`;

const PADDING = "  ";

/**
 * @param {String} name: The migration name
 * @param {Object} options:
 * @param {String} [options.table] (optional): the migration table name
 * @param {String} [options.filename] (optional): the migration file name
 * @param {Array} [options.fields]: The fields of the migration
 * @param {String} [options.type]: The migration type. Valid types include
 *   "create-table"|"update-table"|"alter-table"
 */
async function createMigration(name, options) {
  let { fields, filename, table, type } = options || {};

  try {
    const migrationsDir = getMigrationsPath();
    const date = new Date()
      .toISOString()
      .split(".")[0]
      .replace(/[^\d]/gi, "")
      //.replace(/[T-]/g, "_")
      //.replace(/:/g, "")
      .toString();

    const migrationFields = parseModelFields(fields, true);

    table = normalizeTableName(table ?? name);
    filename = (filename ?? `${date}-${normalizeFileName(name)}`) + ".js";

    const destination = `${migrationsDir}/${filename}`;
    const data = readFromFile(`${TEMPLATES_DIR}/sequelize/migration_${type}.stub`);
    const output = data
      .replace(/\$\$TABLE_NAME\$\$/gm, table)
      .replace(/\$\$MIGRATION_FIELDS\$\$/gm, migrationFields);

    writeToFile(destination, output, { flag: "w" });
    print(
      `${PADDING}Created: src > database > migrations > sequelize > ${filename}`
    );
    print(`${PADDING}Migration ${destination} generated.`);

    return destination;
  } catch(err) {
    return printErrorMessage(err, "Error creating Sequelize-based migration");
  }
}

async function migrate(options) {
  try {
    const { database, /*step, reset*/ } = options || {};

    const migrator = createSequelizeMigrator({
      sequelize: await getDatabaseConnection(database),
      logger: console,
      migrationsPath: getMigrationsPath(),
    });

    const data = await migrator.migrate();

    /*[{
      name: '20240809081958-create-pets-table.js',
      path: '\test-app\\src\\database\\migrations\\sequelize\\20240809081958-create-pets-table.js'
    }]*/
    return data;
  } catch(err) {
    return printErrorMessage(err, "Error running Sequelize-based migrations");
  }
}

async function rollback(options) {
  try {
    const opts = {};
    const { database, step, reset } = options || {};
    const migrator = createSequelizeMigrator({
      sequelize: await getDatabaseConnection(database),
      logger: console,
      migrationsPath: getMigrationsPath(),
    });

    if(typeof step === "number") {
      opts.step = step;
    }

    if(reset) {
      opts.to = 0;
    }

    const data = await migrator.rollback(opts);

    return data;
  } catch(err) {
    return printErrorMessage(err, "Error running Sequelize-based migration rollbacks");
  }
}

function parseModelFields(fields, isMigrationField) {
  let modelFields = "";

  (Array.isArray(fields) ? fields : []).forEach((field) => {
    let item = field.split(":");
    let name = item[0];
    let type = item[1];
    let dataType;

    switch(type) {
    case SEQUELIZE_DATA_TYPES.STRING:
      dataType = "DataTypes.STRING";
      break;

    case SEQUELIZE_DATA_TYPES.INTEGER:
      dataType = "DataTypes.INTEGER";
      break;

    case SEQUELIZE_DATA_TYPES.DATE:
      dataType = "DataTypes.DATE";
      break;

    case SEQUELIZE_DATA_TYPES.UUID:
      dataType = "DataTypes.UUID";
      break;

    case SEQUELIZE_DATA_TYPES.BOOLEAN:
      dataType = "DataTypes.BOOLEAN";
      break;

    default:
      throwLibraryError(
        `Invalid datatype '${type}'`
      );
    }

    if(isMigrationField) {
      if(!["id", "createdAt", "updatedAt"].includes(name)) {
        modelFields === ""
          ? (modelFields = name + ": { type: " + dataType + " },")
          : (modelFields =
              modelFields + "\n\t\t\t" + name + ": { type: " + dataType + " },");
      }
    } else {
      if(!["id", "createdAt", "updatedAt"].includes(name)) {
        modelFields === ""
          ? (modelFields = name + ": " + dataType + ",")
          : (modelFields += "\n\t\t" + name + ": " + dataType + ",");
      }

      if(name === "id") {
        const field = generateSequelizeIdField(dataType);

        modelFields === ""
          ? (modelFields = field + ",")
          : (modelFields += "\n\t\t" + field + ",");
      }
    }
  });

  return modelFields;
}

async function getDatabaseConnection(database) {
  const { authenticationParams, connectionOptions } = getSequelizeConnectionData(database);
  const sequelize = connectionOptions
    ? new Sequelize(authenticationParams, connectionOptions)
    : new Sequelize(authenticationParams);

  await sequelize?.authenticate();

  return sequelize;
}

/**
 * @param {String} database: The database connection name.
 *   Valid values are: mariadb|memory|mysql|postgres|sqlite.
 */
function getSequelizeConnectionData(database) {
  let authenticationParams;
  let connectionOptions;

  const options = getDatabaseOptions(database);
  const { host, port, username, password, dbName, dbEngine, storagePath } = options;
  const logging = process.env.NODE_ENV === "development" ? console.log : false;
  const connOpts = { logging };

  if(dbEngine.toLowerCase() === "memory") {
    authenticationParams = "sqlite::memory";
    connectionOptions = connOpts;
  } else if(dbEngine.toLowerCase() === "sqlite") {
    // We are assuming and working with sqlite as being
    // on the local system as the application.
    // To use a remote DB, use a dbEngine other than sqlite.
    // Cf. https://www.sqlite.org/useovernet.html
    // for why we are doing it this way.
    authenticationParams = {
      ...connOpts,
      dialect: "sqlite",
      storage: `${storagePath.replace(/\\/g, "/")}/${dbName.replace(/\.sqlite$/i, "")}.sqlite`,
    };
  } else {
    let dsn;

    if(options.url?.trim()?.length > 0) {
      dsn = options.url.trim();
    } else {
      dsn = `${dbEngine}://`;
      dsn += username ? username : "";
      dsn += password ? `:${password}` : "";
      dsn += ((username ? "@" : "") + `${host}:${port}/${dbName}`);
    }

    authenticationParams = dsn;
    connectionOptions = connOpts;
  }

  return {
    authenticationParams,
    connectionOptions,
  };
}

function generateSequelizeIdField(dataType) {
  dataType = dataType || "DataTypes.INTEGER";

  const data = [
    "id: {",
    "\n\t\t\tallowNull: false,",
    "\n\t\t\tprimaryKey: true,",
    `\n\t\t\ttype: ${dataType},`,
  ];

  if(dataType === "DataTypes.INTEGER") {
    data.push("\n\t\t\tautoIncrement: true");
  }

  data.push("\n\t\t}");

  return data.join("");
}

/*
 * ORM API:
 * - {Function} `createMigration`
 * - {Function} `migrate`
 * - {Function} `rollback`
 * - {Function} `parseModelFields`
 * - {Function} `getDatabaseConnection`
 * - {Array<String>} `databases`
 */
module.exports = {
  createMigration,
  migrate,
  rollback,
  parseModelFields,
  getDatabaseConnection,
  databases: ["db2", "mariadb", "memory", "mssql", "mysql", "oracle", "postgres", "sqlite"],
};
