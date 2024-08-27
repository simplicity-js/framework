"use strict";

/**
 * Used for the framework's internal caching purposes,
 * e.g., caching information relating to maintenance mode.
 */

const path = require("node:path");
const NodeCache  = require("node-cache");
const Connections = require("../../connections");
const CacheFactory = require("../../factory/cache");

const nodeCache = new NodeCache();

/**
 * @param {Object} config (required)
 * @param {String} driver (required): "file"|"memory"|"redis"
 * @param {String} storageFile (optional): used when driver is "file"
 * @return {Object} cache with methods: set, get, contains, unset, client.
 */
module.exports = function getCacheStorage(driver, config, storageFile) {
  storageFile = storageFile ?? "framework.cache";

  const cacheParams = { driver };

  switch(driver) {
  case "file":
    cacheParams.storagePath = path.join(__dirname, storageFile);
    break;

  case "redis":
    const redisClient = Connections.get("redis", config.get("redis"));
    cacheParams.connection = redisClient;
    break;

  case "memory":
  default:
    cacheParams.store = nodeCache;
    break;
  }

  return CacheFactory.createCache(driver, cacheParams);
};
