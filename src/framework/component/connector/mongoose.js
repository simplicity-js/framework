const mongoose = require("mongoose");


module.exports = class MongooseStore {
  #db = null;
  #options = null;

  /**
   * @param {Object} options object with properties:
   * @param {String} [options.host]: the db server host
   * @param {Number} [options.port]: the db server port
   * @param {String} [options.username]: the db server username
   * @param {String} [options.password]: the db server user password
   * @param {String} [options.dbName]: the name of the database to connect to
   * @param {String} [options.url]: full DSN of the mongodb server
   *   If the [options.url] is set, it is used instead
   *   and the other options (except [options.debug]) are ignored.
   *   For this reason, when using the url option, also specify the database name
   *   in the DSN string.
   * @param {Boolean} [options.debug] determines whether or not to show debugging output
   */
  constructor(options) {
    this.setOptions(options);
    this.connect();
  }

  /**
   * Connect to a MongoDB server instance
   *
   * @return {resource} a (mongoose) connection instance
   */
  async connect() {
    const options = this.#options;
    const { host, port, username, password, dbName, debug } = options;

    let dsn;

    if(options.url?.trim()?.length > 0) {
      dsn = options.url;
    } else {
      dsn = "mongodb://";

      if(username) {
        dsn += username;
      }

      if(password) {
        dsn += `:${password}`;
      }

      dsn += ( (username ? "@" : "") + `${host}:${port}/${dbName}` );
    }

    mongoose.set("debug", debug);

    this.#db = await mongoose.connect(dsn, {});

    return this.#db;
  }

  async disconnect() {
    await this.#db.disconnect();
  }

  setOptions(options) {
    const {
      url      = "",
      host     = "0.0.0.0",
      port     = 27017,
      username = "",
      password = "",
      dbName   = "users",
      debug    = false,
      exitOnConnectFail = false,
    } = options;

    this.#options = { url, host, port, username, password, dbName, debug, exitOnConnectFail };
  }
};
