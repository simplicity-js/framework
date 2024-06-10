const redis  = require("redis");


module.exports = class RedisStore {
  #client = null;
  #options = null;

  /**
   * @param {Object} options (optional): connection options
   * @param {String} [options.host]: the server host
   * @param {Number} [options.port]: the server port
   * @param {String} [options.username]: the server username
   * @param {String} [options.password]: the server user password
   * @param {String} [options.db]: the database to connect to
   * @param {String} [options.url]: full DSN of the Redis server
   *   If the [options.url] is set, it is used instead
   *   and the other options are ignored.
   * @param {Boolean} [options.autoConnect]: whether (true) or not (false) to
   *   automatically connect to the Redis server. Default is true.
   * @return {Promise} resolved with the connection on success.
   */
  constructor(options) {
    if(options) {
      this.setOptions(options);
      this.#createClient();

      if(this.#options.autoConnect) {
        this.connect();
      }
    }
  }

  async connect() {
    if(!this.#options) {
      throw new Error(
        "Connection options not found. " +
        "Call setOptions(options) to set connection options."
      );
    }

    await this.getClient()?.connect();
  }

  async disconnect() {
    await this.getClient().disconnect();
  }

  /**
   * Verify whether or not we have an active connection to a Redis server.
   * @return {Boolean}
   */
  connected() {
    /*
     * check if the the client is connected and ready to send commands (isReady)
     */
    return this.getClient()?.isReady;
  };

  /**
   * Check if the client is (re-)connecting.
   */
  connecting() {
    /*
      * client.isOpen returns:
      *   true when the client's underlying socket is open, and
      *   false when it isn't (for example when the client is still connecting
      *    or reconnecting after a network error).
      */
    return !(this.getClient()?.isOpen);
  }

  /**
   * Retrieve the underlying (node-redis) redis client
   */
  getClient() {
    return this.#client;
  }

  /**
   * Set connection options.
   *
   * @param {Object} options (optional): connection options
   * @param {String} [options.host]: the server host
   * @param {Number} [options.port]: the server port
   * @param {String} [options.username]: the server username
   * @param {String} [options.password]: the server user password
   * @param {String} [options.db]: the database to connect to
   * @param {String} [options.url]: full DSN of the Redis server
   *   If the [options.url] is set, it is used instead
   *   and the other options are ignored.
   * @param {Boolean} [options.autoConnect]: whether (true) or not (false) to
   *   automatically connect to the Redis server. Default is true.
   */
  setOptions(options) {
    const {
      url       = "",
      host      = "localhost",
      port      = 6379,
      username  = "",
      password  = "",
      db        = "",
      autoConnect = false,
    } = options;

    this.#options = { url, host, port, username, password, db, autoConnect };
  }

  #createClient() {
    const options = this.#options;
    const { url, host, port, username, password, db } = options;

    let connString;
    const driverStr = "redis://";

    if(url) {
      connString = url;
    } else {
      connString  = driverStr;

      if(username) {
        connString += username.trim();
      }

      if(password) {
        connString += `:${password.trim()}`;
      }

      if(username || password) {
        connString += "@";
      }

      if(host) {
        connString += host.trim();
      }

      if(port) {
        connString += `:${port}`.trim();
      }

      if(db) {
        connString += `/${db}`.trim();
      }
    }

    connString = connString.trim();

    const client = (connString === driverStr
      ? redis.createClient() // If no credentials given, connect with default Redis credentials
      : redis.createClient({ url: connString }) // else, connect with supplied credentials
    );

    this.#client = client;
  }
};
