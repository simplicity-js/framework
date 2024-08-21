const path = require("node:path");
const env = require("../../../../../env");

let sequelizeLoggingOption = false;

if(env("NODE_ENV") === "development" && env("LOG_TO_CONSOLE")) {
  sequelizeLoggingOption = console.log;
}

module.exports = {
  /*
   * ---------------------------------
   * Default Database Connection Name
   * ---------------------------------
   *
   * The database connection to use as the default for database operations.
   * This connection will be used unless another connection
   * is explicitly specified when you execute a query.
   */
  default: env("DB_CONNECTION", "sqlite").toLowerCase(),

  /*
   * ---------------------
   * Database Connections
   * ---------------------
   *
   * The database connections defined for your application.
   * An example configuration is provided for each supported database system.
   * You're free to add / remove connections.
   *
   */
  connections: {
    mongodb: {
      url      : `mongodb://127.0.0.1/${env("DB_DBNAME")}`,
      host     : env("DB_HOST"),
      port     : env("DB_PORT", 27017),
      username : env("DB_USERNAME"),
      password : env("DB_PASSWORD"),
      dbName   : env("DB_DBNAME"),
      exitOnConnectFail: true,
    },

    sqlite: {
      dbEngine    : "sqlite",
      dbName      : env("DB_DBNAME"),
      logging     : sequelizeLoggingOption,
      storagePath : path.resolve(
        path.dirname(path.dirname(__dirname)),
        "storage",
        env("DB_STORAGE_PATH", ".sqlite")
      ),
    },

    /*
     * Define below other database connections
     * as required by your application for mariadb, postgres, etc.
     */
  },
};
