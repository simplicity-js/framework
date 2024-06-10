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
      cacheParams.connection = container.resolve("redis");
    }

    const cache = CacheFactory.createCache(cacheDriver, cacheParams);

    /*
     * Bind the default cache to the container
     */
    container.bindWithFunction("cache", function createCache() {
      return cache;
    });
  }
};
