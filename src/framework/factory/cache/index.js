const is = require("../../lib/is");
const createFileCache = require("./file-cache");;
const createMemoryCache = require("./memory-cache");
const createRedisCache = require("./redis-cache");

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
          `one of either properties: ${expectedProps.join(", ")}`
        );
      }
    } else if(driver === "file" && !config.storagePath) {
      throw new Error(
        errorPrefix +
        "The `config` parameter for the 'file' driver expects an object with a " +
        "`storagePath` string property"
      );
    } else if(!is.object(config.store)) {
      const expectedStoreMethods = ["get", "set", "has", "keys", "del"];

      throw new Error(
        errorPrefix +
        "The `config` parameter for the 'memory' driver expects an object with a " +
        `\`store\` object property having methods: ${expectedStoreMethods.join(", ")}`
      );
    }

    switch(driver) {
    case "file"   : cacheCreationFn = createFileCache; break;
    case "redis"  : cacheCreationFn = createRedisCache; break;
    case "memory" :
    default       : cacheCreationFn = createMemoryCache; break;
    }

    const cache = cacheCreationFn(config);

    return unifiedCache(driver, cache);
  }
};


function unifiedCache(driver, cache) {
  driver = driver.toLowerCase();

  return {
    /**
     * @param {String} key: the cache key
     * @param {String} value: the value to cache
     * @param {Object} options: caching options
     * @param {Boolean} [options.replace] (optional): replace existing key.
     *   Default is true.
     * @param {Number} [options.duration] (optional): how long (in seconds) to keep
     *   the cached value in the cache.
     */
    async set(key, value, { duration, replace }) {
      if(driver === "redis") {
        return await cache.set(key, value, { duration, replace });
      } else {
        return await cache.set(key, value, duration);
      }
    },

    async get(key) {
      return await cache.get(key);
    },

    async contains(key) {
      return await cache.contains(key);
    },

    async unset(key) {
      return await cache.unset(key);
    },
  };
}
