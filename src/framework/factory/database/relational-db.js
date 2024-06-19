const SequelizeStore = require("../../component/connector/sequelize");


/**
 * @param {Object} options object with properties:
 * @param {String} [options.dbEngine]: The database engine to use.
 *   "memory" | "mysql" | "postgres" | "sqlite" | "mariadb"
 *   Make sure the appropriate driver for the selected engine is installed.
 * @param {String} [options.host]: the db server host
 * @param {Number} [options.port]: the db server port
 * @param {String} [options.username]: the db server username
 * @param {String} [options.password]: the db server user password
 * @param {String} [options.dbName]: the name of the database to connect to
 * @param {String} [options.url]: full DSN of the mysql server
 *   If the [options.url] is set, it is used instead
 *   and the other options are ignored. For this reason,
 *   when using the url option, also specify the database name
 *   in the URL string.
 */
module.exports = async function createSqlStore(options) {
  const sequelizeStore = new SequelizeStore(options);
  const db = sequelizeStore.getClient();
  const driver = options.dbEngine;

  if(!sequelizeStore.connected()) {
    await sequelizeStore.connect();
  }

  return { db, driver };
};
