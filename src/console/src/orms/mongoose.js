const mongoose = require("mongoose");
const getReplaceInFile = () => import("replace-in-file").then(rif => rif);
const { MIGRATION_FOLDER_DESTINATION, MONGOOSE_DATA_TYPES, TEMPLATES_DIR
} = require("../helpers/constants");
const { printErrorMessage, throwLibraryError } = require("../helpers/error");
const { normalizeModelName, normalizeFileName } = require(
  "../helpers/normalizers");
const { getDatabaseOptions, getMigrationFileInfo } = require("./helpers/database");
const createMongooseMigrator = require("./helpers/mongoose-migrator");

const getMigrationsPath = () => `${process.cwd().replace(/\\/g, "/")}/${MIGRATION_FOLDER_DESTINATION}/mongoose`;
const migratorOptions = {
  collection: "migrations",
  logErrors: false,
};

async function createMigration(name, options) {
  let mongooseMigrator;
  let { table: collection = "", type } = options || {};
  const { connectionString } = getMongoDbConnectionString();

  try {
    const migrationsDir = getMigrationsPath();

    const template = `${TEMPLATES_DIR}/mongoose/migration_${type}.stub`;
    mongooseMigrator = createMongooseMigrator({
      ...migratorOptions,
      template,
      migrationsDir,
      dbUrl: connectionString,
    });
    const data = await mongooseMigrator.createMigration(name);

    if(!data) {
      throwLibraryError(
        `A migration with name '${name}' already exists in the database.`
      );
    }

    const replacer = await getReplaceInFile();
    const migrationFileInfo = getMigrationFileInfo(name, migrationsDir);
    const destination = migrationFileInfo.filePath;
    const modelName = normalizeModelName(collection);

    await replacer.replaceInFile({
      files: [destination],
      from: [
        /\$\$MODEL_NAME\$\$/g,
        /\$\$MODEL_FILE_NAME\$\$/g,
      ],
      to: [
        modelName,
        normalizeFileName(modelName),
      ],
    });

    return destination;
  } catch(err) {
    return printErrorMessage(err, "Error creating Mongoose-based migration");
  } finally {
    if(mongooseMigrator) {
      await mongooseMigrator.close();
    }
  }
}

async function migrate() {
  let migrator;
  const { connectionString } = getMongoDbConnectionString();

  try {
    migrator = createMongooseMigrator({
      ...migratorOptions,
      dbUrl: connectionString,
      migrationsDir: getMigrationsPath(),
    });

    const data = await migrator.migrate();

    migrator.close();

    /*[{
        state: 'up|down',
        name: 'migration-name',
        createdAt: YYYY-mm-ddThh:mm:ss.230Z,
        filename: 'timestamp-migration-name.js'
    }]*/
    return data;
  } catch(err) {
    return printErrorMessage(err, "Error running mongoose-based migrations");
  } finally {
    if(migrator) {
      await migrator.close();
    }
  }
}

async function rollback() {
  let migrator;
  const { connectionString } = getMongoDbConnectionString();

  try {
    migrator = createMongooseMigrator({
      ...migratorOptions,
      dbUrl: connectionString,
      migrationsDir: getMigrationsPath(),
    });

    const data = await migrator.rollback();

    return data;
  } catch(err) {
    return printErrorMessage(err, "Error running mongoose-based migration rollbacks");
  } finally {
    if(migrator) {
      await migrator.close();
    }
  }
}

function parseModelFields(fields) {
  let modelFields = "";

  (Array.isArray(fields) ? fields : []).forEach(field => {
    let dataType;
    const [name, type] = field.split(":");

    switch(type) {
    case MONGOOSE_DATA_TYPES.ARRAY:
      dataType = "Array";
      break;

    case MONGOOSE_DATA_TYPES.BIGINT:
      dataType = "BigInt";
      break;

    case MONGOOSE_DATA_TYPES.BOOLEAN:
      dataType = "Boolean";
      break;

    case MONGOOSE_DATA_TYPES.BUFFER:
      dataType = "Buffer";
      break;

    case MONGOOSE_DATA_TYPES.DATE:
      dataType = "Date";
      break;

    case MONGOOSE_DATA_TYPES.DECIMAL:
    case MONGOOSE_DATA_TYPES.FLOAT:
      dataType = "Decimal128";
      break;

    case MONGOOSE_DATA_TYPES.NUMBER:
    case MONGOOSE_DATA_TYPES.INTEGER:
      dataType = "Number";
      break;

    case MONGOOSE_DATA_TYPES.MAP:
      dataType = "Map";
      break;

    case MONGOOSE_DATA_TYPES.MIXED:
      dataType = "Mixed";
      break;

    case MONGOOSE_DATA_TYPES.OBJECTID:
      dataType = "ObjectId";
      break;

    case MONGOOSE_DATA_TYPES.SCHEMA:
      dataType = "Schema";
      break;

    case MONGOOSE_DATA_TYPES.STRING:
      dataType = "String";
      break;

    case MONGOOSE_DATA_TYPES.UUID:
      dataType = "UUID";
      break;

    default:
      throwLibraryError(`Invalid datatype '${type}'`);
    }

    if(!["created_at", "updated_at"].includes(name)) {
      modelFields === ""
        ? (modelFields = name + ": " + dataType + ",")
        : (modelFields += "\n\t" + name + ": " + dataType + ",");
    }
  });

  return modelFields;
}

async function getDatabaseConnection() {
  const { connectionString, connectionOptions } = getMongoDbConnectionString();
  const mongooseConn = await mongoose.connect(connectionString, connectionOptions);
  const connection = mongooseConn.connection;

  /*const database = authParams.substring(
    authParams.lastIndexOf("/") + 1
  );*/

  //connection.url = connection.url || authParams;

  return connection;
}

function getMongoDbConnectionString() {
  let connString;
  let dbConfig;

  dbConfig = getDatabaseOptions("mongodb");

  if(dbConfig.url) {
    connString = dbConfig.url;
  } else {
    const { host, port, username, password, dbName } = dbConfig;

    connString = "mongodb://";
    connString += username ? username : "";
    connString += password ? `:${password}` : "";
    connString += username ? "@" : "";
    connString += `${host}:${port}/${dbName}`;
  }

  return {
    connectionString: connString,
    connectionOptions: {},
  };
}

/*
 * ORM API:
 * - {String} `name`
 * - {Function} `createMigration`
 * - {Function} `migrate`
 * - {Function} `rollback`
 * - {Function} `parseModelFields`
 * - {Function} `getDatabaseConnection`
 * - {Array<String>} `databases`
 */
module.exports = {
  name: "mongoose",
  createMigration,
  migrate,
  rollback,
  parseModelFields,
  getDatabaseConnection,
  databases: ["mongodb"],
};
