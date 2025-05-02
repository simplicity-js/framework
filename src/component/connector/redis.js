const redis  = require("redis");
const util = require("node:util");
const debug = require("../../lib/debug");
const { sleep } = require("../../lib/util");
const validateConnectionOptions = require("./connection-validator");


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
    debug("Creating RedisStore Instance...");

    if(options) {
      const validatedOptions = this.#validate(options);

      this.setOptions(validatedOptions);
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

    let attempts = 0;
    const client = this.getClient();
    const maxAttempts = this.#options.maxConnectionAttempts;
    const exitOnConnectionFailure = this.#options.exitOnConnectionFailure;

    while(attempts < maxAttempts) {
      try {
        debug("Connecting to Redis...");

        await client.connect();

        debug("Redis connection established.");
      } catch(e) {
        if(e.message === "Socket already opened") {
          // A connection already exists
          debug("Redis connection already established.");
          return;
        }

        attempts++;

        console.warn(`Redis connection error: ${util.inspect(e)}`);
        console.log(`Retrying connection to Redis (${attempts}/${maxAttempts}) attempts`);

        if(e.code === "ECONNREFUSED") {
          // Disconnect so that the next call to client.connect() will work.
          // Otherwise, after the first failure due to ECONNREFUSED,
          // we'll be stuck and no more calls to client.connect() will happen.
          await client.disconnect();
        }

        if((attempts === maxAttempts)) {
          if(exitOnConnectionFailure) {
            console.error(`Failed to connect to Redis after ${maxAttempts} attempts. Exiting...`);
            process.exit(1);
          } else {
            console.warn(`Failed to connect to Redis after ${maxAttempts} attempts.`);
          }
        }

        await sleep(1000 * attempts); // Exponential backoff
      }
    }
  }

  async disconnect() {
    try {
      debug("Disconnecting from Redis...");

      await this.getClient().disconnect();

      debug("Redis disconnection complete.");
    } catch(e) {
      debug(`Redis disconnection error: ${util.inspect(e)}`);
    }
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
   * @param {Number} [options.maxConnectionAttempts]
   * @param {Boolean} [options.autoConnect]: whether (true) or not (false) to
   * @param {Boolean} [options.legacyMode]
   *   automatically connect to the Redis server. Default is true.
   */
  setOptions(options) {
    debug("Setting Redis connection options...");

    this.#options = options;

    debug("Redis connection options set.");
  }

  #createClient() {
    debug("Creating Redis client...");

    const options = this.#options;
    const { url, host, port, username, password, db, legacyMode } = options;

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
        if(port) {
          connString += host.replace(`:${port}`, "").trim();
        } else {
          connString += host.trim();
        }
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
      ? redis.createClient({ legacyMode }) // If no credentials given, connect with default Redis credentials
      : redis.createClient({ url: connString, legacyMode }) // else, connect with supplied credentials
    );

    client.on("error", (e) => {
      // This happens during the connection phase.
      // Throw it so the connect() method can handle it as appropriate.
      if(e.code === "ECONNREFUSED") {
        throw e;
      } else {
        debug("Redis client error", util.inspect(e));
      }
    });

    this.#client = client;

    debug("Redis client created.");
  }

  #validate(options) {
    debug("Validating redis connection options...");

    let validatedOptions;
    const validateAgainst = {
      driver: "redis",
      defaults: { host: "localhost", port: 6379, username: "", password: "", db: "" },
      required: ["host", "port"],
    };

    if(options?.url) {
      validatedOptions = validateConnectionOptions(options.url, validateAgainst);
    } else {
      validatedOptions = validateConnectionOptions(options, validateAgainst);
    }

    debug("Redis connection options validated.");

    return {
      ...validatedOptions,
      url: options?.url,
      autoConnect: options?.autoConnect,
      legacyMode: options?.legacyMode,
      maxConnectionAttempts: parseInt(options?.maxConnectionAttempts, 10) || 5,
      exitOnConnectionFailure: options?.exitOnConnectionFailure,
    };
  }
};
