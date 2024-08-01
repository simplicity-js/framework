const util = require("node:util");
const { Sequelize } = require("sequelize");
const debug = require("../../lib/debug");
const validateConnectionOptions = require("./connection-validator");


module.exports = class SequelizeStore {
  #db = null;
  #dbEngine = "memory";
  #options = null;
  #connected = false;

  /**
   * @param {Object} options object with properties:
   * @param {String} [options.dbEngine]: The database engine to use.
   *   "memory" | "mysql" | "postgres" | "sqlite" | "mariadb"
   *   Make sure the appropriate driver for the selected engine is installed.
   * @param {String} [options.host]: the db server host
   * @param {Number} [options.port]: the db server port
   * @param {String} [options.username]: the db server username
   * @param {String} [options.password]: the db server user password
   * @param {String} [options.storagePath]: the storage location for sqlite databases.
   * @param {String} [options.dbName]: the name of the database to connect to
   * @param {Boolean} [options.logging]: Whether to enable logging or not.
   * @param {String} [options.url]: full DSN of the mysql server
   *   If the [options.url] is set, it is used instead
   *   and the other options are ignored. For this reason,
   *   when using the url option, also specify the database name
   *   in the URL string.
   */
  constructor(options) {
    this.#debug("Creating SequelizeStore Instance...");

    const validatedOptions = this.#validate(options);
    const {
      url, host, port, username, password,
      dbEngine, storagePath, dbName, logging
    } = validatedOptions;

    this.#options = {
      url, host, port, username, password,
      dbEngine, storagePath, dbName, logging
    };

    this.#dbEngine = dbEngine;

    this.createDbObject();
    this.connect();
  }

  createDbObject() {
    this.#debug("Creating Sequelize object...");

    let dsn;
    let sequelize;
    const options = this.#options;
    const {
      host, port, username, password,
      dbEngine, storagePath, dbName, logging
    } = options;

    /*
     * Handle [SEQUELIZE0002] DeprecationWarning: The logging-option should be
     * either a function or false. Default: console.log
     */
    const loggingOption = typeof logging === "function" ? logging : false;
    const connOpts = { logging: loggingOption };

    if(dbEngine.toLowerCase() === "memory") {
      sequelize = new Sequelize("sqlite::memory:", connOpts);
    } else if(dbEngine.toLowerCase() === "sqlite") {
      // We are assuming and working with sqlite as being
      // on the local system as the application.
      // To use a remote DB, use a dbEngine other than sqlite.
      // Cf. https://www.sqlite.org/useovernet.html
      // for why we are doing it this way.
      sequelize = new Sequelize({
        ...connOpts,
        dialect: "sqlite",
        storage: `${storagePath}/${dbName.replace(/\.sqlite$/i, "")}.sqlite`,
      });
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

    this.#debug("Sequelize object created.");
  }

  /**
   * Connect to a MongoDB server instance
   *
   * @return {resource} a (mongoose) connection instance
   */
  async connect() {
    const dbEngine = this.#dbEngine;

    try {
      this.#debug(`Connecting to ${dbEngine}...`);

      await this.#db.authenticate();

      this.#connected = true;

      this.#debug(`${dbEngine} connection established`);
    } catch(e) {
      this.#debug(`Sequelize connection error: ${util.inspect(e)}`);
    }

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
    const dbEngine = this.#dbEngine;

    try {
      this.#debug(`Disconnecting from ${dbEngine}`);

      await this.#db.close();

      this.#connected = false;

      this.#debug(`${dbEngine} disconnection complete`);
    } catch(e) {
      this.#debug(`Sequelize disconnection error: ${util.inspect(e)}`);
    }
  }

  connected() {
    return this.#connected;
  }

  getClient() {
    return this.#db;
  }

  #validate(options) {
    this.#debug("Validating Sequelize connection options...");

    let validatedOptions;

    const validateAgainst = {
      driver: options.dbEngine || "sqlite::memory:",
      defaults: {
        host: "0.0.0.0", port: 3006, username: "", password: "",
        dbEngine: "memory", storagePath: "", dbName: "frameworkDb",
        logging: false
      },
      required: ["dbEngine", "dbName"],
    };

    if(!["memory", "sqlite"].includes(options.dbEngine)) {
      validateAgainst.required.push("host", "port");
    }

    if(options?.url) {
      validatedOptions = validateConnectionOptions(options.url, validateAgainst);
    } else {
      validatedOptions = validateConnectionOptions(options, validateAgainst);
    }

    this.#debug("Sequelize connection options validated.");

    return validatedOptions;
  }

  #debug(message) {
    debug(`Connector::Sequelize: ${message}`);
  }
};
