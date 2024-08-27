const is = require("../../lib/is");
const serializer = require("../../component/serializer");
const createFileCache = require("./file-cache");;
const createMemoryCache = require("./memory-cache");
const createRedisCache = require("./redis-cache");

const { serialize, deserialize } = serializer;
const supportedCacheTypes = ["file", "memory", "redis"];

module.exports = class CacheFactory {
  /**
   * @param {String} driver: the type of cache to get.
   *   Supported drivers include "file", "memory", "redis".
   *   Default is "memory".
   * @param {Object} config: the configuration for the specified cache driver.
   * @return {Object}
   */
  static createCache(driver, config) {
    let cacheCreationFn;
    const errorPrefix = "CacheFactory::getCache(driver, config): ";

    driver = String(driver).toLowerCase();

    if(!supportedCacheTypes.includes(driver)) {
      throw new Error(
        errorPrefix +
        "Invalid `driver` parameter. " +
        `Supported drivers include ${supportedCacheTypes.join(", ")}`
      );
    }

    if(!config || typeof config !== "object") {
      throw new Error(
        errorPrefix +
        "The `config` parameter expects an object."
      );
    }

    if(driver === "redis") {
      if(!is.object(config.connection) && !is.object(config.credentials)) {
        const expectedProps = [
          "connection",
          "credentials{ url | (host, port, username, password, db) }"
        ];

        throw new Error(
          errorPrefix +
          "The `config` parameter for the 'redis' driver expects an object with " +
          `one of either properties: ${expectedProps.join(", ")}.`
        );
      }
    } else if(driver === "file" && !config.storagePath) {
      throw new Error(
        errorPrefix +
        "The `config` parameter for the 'file' driver expects an object with a " +
        "`storagePath` string property."
      );
    } else if(driver === "memory" && !is.object(config.store)) {
      const expectedStoreMethods = ["get", "set", "has", "keys", "del"];

      throw new Error(
        errorPrefix +
        "The `config` parameter for the 'memory' driver expects an object with a " +
        `\`store\` object property having methods: ${expectedStoreMethods.join(", ")}.`
      );
    }

    switch(driver) {
    case "file"   : cacheCreationFn = createFileCache; break;
    case "redis"  : cacheCreationFn = createRedisCache; break;
    case "memory" :
    default       : cacheCreationFn = createMemoryCache; break;
    }

    const cache = cacheCreationFn(config);

    return unifiedCacheInterface(driver, cache);
  }
};


function unifiedCacheInterface(driver, cache) {
  return {
    driver: driver.toLowerCase(),

    /**
     * @param {String} key: the cache key
     * @param {String} value: the value to cache
     * @param {Object} options: caching options
     * @param {Boolean} [options.replace] (optional): replace existing key.
     *   Default is true.
     * @param {Number} [options.duration] (optional): how long (in seconds) to keep
     *   the cached value in the cache.
     */
    async set(key, value, config) {
      const { duration, replace = true } = config || {};

      // The `replace` option is used by the redis driver
      return await cache.set(key, serialize(value), { duration, replace });
    },

    async get(key, defaultValue) {
      let value;
      const cachedValue = await cache.get(key);

      if(cachedValue) {
        value = deserialize(cachedValue);
      } else if(defaultValue) {
        value = defaultValue;
      }

      return value;
    },

    async contains(key) {
      return await cache.contains(key);
    },

    async unset(key) {
      return await cache.unset(key);
    },

    client() {
      return cache.client();
    },
  };
}
