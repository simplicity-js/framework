const { Sequelize } = require("sequelize");


module.exports = class SequelizeStore {
  #db = null;
  #dbEngine = "memory";
  #options = null;

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
  constructor(options) {
    const {
      dsn      = "",
      host     = "0.0.0.0",
      port     = 3006,
      username = "",
      password = "",
      dbEngine = "memory",
      dbName   = "orders",
    } = options;

    this.#options = { dsn, host, port, username, password, dbEngine, dbName };
    this.#dbEngine = dbEngine;

    this.createDbObject();
    this.connect();
  }

  createDbObject() {
    let dsn;
    let sequelize;
    const options = this.#options;
    const { host, port, username, password, dbEngine, dbName } = options;
    //const connOpts = { logging: logger.debug.bind(logger) };

    if(dbEngine.toLowerCase() === "memory") {
      sequelize = new Sequelize("sqlite::memory:", connOpts);
    } else {
      if(options.url?.trim()?.length > 0) {
        dsn = options.url?.trim();
      } else {
        dsn = `${dbEngine}://`;

        if(username) {
          dsn += username;
        }

        if(password) {
          dsn += `:${password}`;
        }

        dsn += ((username ? "@" : "") + `${host}:${port}/${dbName}`);
      }

      sequelize = new Sequelize(dsn, connOpts);
    }

    this.#db = sequelize;
  }

  /**
   * Connect to a MongoDB server instance
   *
   * @return {resource} a (mongoose) connection instance
   */
  async connect() {
    await this.#db.authenticate();

    return this.#db;
  }

  /**
   * Close the connection.
   *
   * WARNING: Once sequelize.close() has been called,
   * it's impossible to open a new connection.
   * You will need to create a new Sequelize instance
   * to access your database again.
   * Cf. https://sequelize.org/docs/v6/getting-started/#closing-the-connection
   */
  async disconnect() {
    await this.#db.close();
  }

  getClient() {
    return this.#db;
  }
};
