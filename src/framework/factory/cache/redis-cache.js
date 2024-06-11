const RedisStore = require("../../component/connector/redis");


/**
 * Create a Redis Cache.
 *
 * @param {Object} options:
 * @param {Object} [options.connection] (optional):
 *    An existing connection to a redis instance.
 *    If this passed, it is used to connect to the Redis server.
 *    Otherwise, we try to connect to a Redis server using the
 *    options.credentials.
 * @param {Object} [options.credentials] (optional):
 *    Credentials for establishing a connection to a Redis server.
 * @param {String} [options.credentials.host]: the server host
 * @param {Number} [options.credentials.port]: the server port
 * @param {String} [options.credentials.username]: the server username
 * @param {String} [options.credentials.password]: the server user password
 * @param {String} [options.credentials.db]: the database to connect to
 * @param {String} [options.credentials.url]: full DSN of the Redis server
 *   If the [options.credentials.url] is set, it is used instead
 *   and the other credential options are ignored.
 * @return {Object} with methods: set(), get(), unset(), contains(), and client().
 */
module.exports = function createRedisStore(options) {
  const { connection, credentials } = options || {};

  let store;

  if(connection && typeof connection === "object") {
    store = connection;
  } else if(credentials && typeof credentials === "object") {
    const redisStore = new RedisStore(credentials);
    store = redisStore.getClient();

    setTimeout(async function() {
      if(!redisStore.connecting() && !redisStore.connected()) {
        await redisStore.connect();
      }
    }, 1000);
  }

  return {
    driver: "redis",

    /**
     * @param {String} key: the cache key
     * @param {String} value: the value to cache
     * @param {Object} options: caching options
     * @param {Boolean} [options.replace] (optional): replace existing key.
     *   Default is true.
     * @param {Number} [options.duration] (optional): how long (in seconds) to keep
     *   the cached value in the cache.
     */
    async set(key, value, options) {
      const { replace, duration } = options || {};
      const nx = replace ? false : true;

      const storageOptions = {
        /*
         * if true, set a key only if it doesn't already exist in the Redis store.
         * if false, replace a previously existing key.
         */
        NX: nx,
      };

      if(duration) {
        /*
         * accepts a value with the cache duration in seconds
         */
        storageOptions.EX = duration;
      }

      return await store.set(key, value, storageOptions);
    },

    async get(key) {
      return await store.get(key);
    },

    async unset(key) {
      return await store.del(key);
    },

    async contains(key) {
      return await store.sendCommand(["EXISTS", key]);
    },

    async clear() {
      return await store.sendCommand(["FLUSHDB"]);
    },

    client() {
      return store;
    },
  };
};
