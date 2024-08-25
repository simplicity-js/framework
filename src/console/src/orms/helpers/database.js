const fs = require("node:fs");


/**
 * Get the entire database configuration information.
 * @param {String} key (optional):
 *    Valid keys include: "default", "connections"
 */
function getDatabaseConfig(key) {
  const cwd = process.cwd().replace(/\\/g, "/");

  /*
   * We can trust this because the make commands can only be run
   * from within a Simplicity application directory.
   */
  const srcDir = `${cwd}/src`;

  /*
   * This will configure the app, if it hasn't already been configured
   * so that we can have access to the env function
   * used by the database configuration file
   */
  require(`${srcDir}/bootstrap/app`);
  const dbConfig = require(`${srcDir}/config/database`);

  return (key ? dbConfig[key] : dbConfig);
}

/**
 * Get the configuration options for specific database
 * Valid databases include the default supported databases by mongoose and
 * sequelize as well as any databases added by the user via custom ORMs.
 */
function getDatabaseOptions(database) {
  const dbConfig = getDatabaseConfig();
  const connection = database === "default" ? dbConfig.default : database;

  return dbConfig.connections[connection];
}

function getMigrationFileInfo(migrationName, migrationsPath) {
  let target = null;
  let filenameNoTimestamp = "";
  let timestamp = 0;
  const filesInMigrationFolder = fs.readdirSync(migrationsPath);

  for(let i = 0; i < filesInMigrationFolder.length; i++) {
    const currentFile = filesInMigrationFolder[i];
    const timestampSeparatorIndex = currentFile.indexOf("-");

    timestamp = currentFile.slice(0, timestampSeparatorIndex);
    filenameNoTimestamp = currentFile.slice(
      timestampSeparatorIndex + 1,
      currentFile.lastIndexOf(".")
    );

    if(migrationName.toLowerCase() === filenameNoTimestamp.toLowerCase()) {
      target = currentFile;
      break;
    }
  }

  return {
    migrationName: filenameNoTimestamp,
    filePath: target ? `${migrationsPath}/${target}` : "",
    timestamp,
  };
}

module.exports = {
  getDatabaseConfig,
  getDatabaseOptions,
  getMigrationFileInfo,
};
