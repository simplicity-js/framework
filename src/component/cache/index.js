"use strict";

/**
 * Used for the framework's internal caching purposes,
 * e.g., caching information relating to maintenance mode.
 */

const NodeCache  = require("node-cache");
const Connections = require("../../connections");
const CacheFactory = require("../../factory/cache");
const storagePath = require("../../storage-path");

const nodeCache = new NodeCache();

/**
 * @param {String} driver (required): "file"|"memory"|"redis"
 * @param {Object} config (required)
 * @return {Object} cache with methods: set, get, contains, unset, client.
 */
module.exports = function getCacheStorage(driver, config) {
  const cacheParams = { driver };

  switch(driver) {
  case "file":
    cacheParams.storagePath = storagePath("framework/cache/data");
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
