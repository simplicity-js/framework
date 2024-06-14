const RedisStore = require("../framework/component/connector/redis");
const ServiceProvider = require("../framework/component/service-provider");
const CacheFactory = require("../framework/factory/cache");


module.exports = class CacheServiceProvider extends ServiceProvider {
  constructor() {
    super();
  }

  register() {
    const container = this.container();
    const config = container.resolve("config");
    const cacheConfig = config.get("cache");
    const defaultCache = cacheConfig.default;
    const defaultCacheData = cacheConfig.stores[defaultCache];
    const cacheDriver = defaultCacheData.driver;
    const cacheParams = {};

    if(defaultCache === "file") {
      cacheParams.storagePath = defaultCacheData.storagePath;
    } else if(defaultCache === "memory") {
      cacheParams.store = defaultCacheData.store;
    } else if(defaultCache === "redis") {
      const redisClient = this.#connectToRedis(config.get("redis"));

      cacheParams.connection = redisClient;
    }

    const cache = CacheFactory.createCache(cacheDriver, cacheParams);

    /*
     * Bind the default cache to the container
     */
    container.bindWithFunction("cache", function createCache() {
      return cache;
    });
  }


  #connectToRedis(redisCreds) {
    try {
      const redisStore = new RedisStore(redisCreds);
      const redisClient = redisStore.getClient();
      const log = this.#log.bind(this);

      // TO DO: Use a proper log service for this.
      redisClient.on("error", (e) => log("Redis error", require("node:util").inspect(e)));
      redisClient.on("connect", () => log("Redis connection established"));

      setTimeout(async function() {
        if(!redisStore.connecting() && !redisStore.connected()) {
          await redisStore.connect();
        }
      }, 1000);

      return redisClient;
    } catch(e) {
      // TO DO: Use a proper log service for this.
      log("Redis error", require("node:util").inspect(e));
    }
  }

  #log(message) {
    if(this.container().resolve("config").get("app.environment") !== "test") {
      console.log(message);
    }
  }
};
