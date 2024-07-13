const env = require("../framework/env");
const is = require("../framework/lib/is");
const NodeCache  = require( "node-cache" );

module.exports = {
  /*
   * ----------------------
   * Default Cache Storage.
   * ----------------------
   *
   * Specify the default storage to be used for caching.
   * This is the default connection used
   * for running a cache operation inside the application
   * unless another is explicitly specified during the operation.
   */
  default: env("CACHE_STORE", "memory"),

  /*
   * ----------------
   * Cache Key Prefix
   * -----------------
   *
   * When using the Redis cache store,
   * there might be other applications using the same cache. For
   * To avoid collisions, you may prefix every cache key.
   */
  prefix: env("CACHE_KEY_PREFIX", `${env("NAME").toLowerCase().replace(/[\s*,-]+/g, "_")}_cache_`),

  /*
   * Whether to compress the data prior to caching.
   */
  compress: is.falsy(env("CACHE_COMPRESS_DATA")?.toLowerCase()) ? false : true,

  /*
   * -------------
   * Cache Stores
   * -------------
   *
   * You may define all of the cache "stores" for your application as
   * well as their drivers here.
   *
   * Supported drivers include: "file", "memory", and "redis".
   */
  stores: {
    file: {
      driver: "file",
      storagePath: "storage/cache/data",
    },

    memory: {
      driver: "memory",
      store: new NodeCache(),
    },

    redis: {
      driver: "redis",
    },
  },
};
