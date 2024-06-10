const config = require("../config");
const RedisStore = require("../framework/component/connector/redis");
const createObjectStore = require("../framework/component/registry");
const ServiceProvider = require("../framework/component/service-provider");


/*
 * Extending the parent `ServiceContainer` gives us access to
 * the DI Container via `this.container()` method.
 */
class AppServiceProvider extends ServiceProvider {
  constructor() {
    super();

    /*
     * Connect to resources: (redis, databases, etc)
     */
    this.redisClient = this.#connectToRedis(config.get("redis"));
  }

  /**
   * Register the service's dependencies in the dependency container.
   */
  register() {
    const container = this.container();

    container.bindWithFunction("config", function configGetter() {
      return config;
    });

    container.bindWithFunction("redis", function redisGetter(redisClient) {
      return redisClient;
    }, this.redisClient);

    /*
     * Bind a global registry to the container.
     * This allows the app to manage
     * (insert, retrieve, check existence, and remove) global objects.
     * The main advantage the registry provides over the container
     * is that the registry allows us to insert nested values to global objects
     * without pre-defining the object.
     * For example, using the registry we can do the following:
     *    const registry = container.resolve("registry");
     *    registry.add("my.object.nested.key", value);
     * without first having to do somethig pre-create the my.object.nested like:
     *    const my = { object: { nested: } };
     *    my.object.nested.key = value;
     *
     * Secondly, the registry lets us specify a default value to retrieve
     * when attempting to retrieve a value that may (not) exist in the registry:
     * const value = container.resolve("registry").get(key, defaultValue);
     * If an object has been stored with the `key` key in the registry,
     * value will be that object, otherwise, value will be whatever is passed as
     * defaultValue.
     */
    container.bindWithFunction("registry", function createRegistry() {
      return createObjectStore();
    });
  }

  #connectToRedis(redisCreds) {
    try {
      const redisStore = new RedisStore(redisCreds);
      const redisClient = redisStore.getClient();

      // TO DO: Use a proper log service for this.
      redisClient.on("error", (e) => console.log("Redis error", require("node:util").inspect(e)));
      redisClient.on("connect", () => console.log("Redis connection established"));

      setTimeout(async function() {
        if(!redisStore.connecting() && !redisStore.connected()) {
          await redisStore.connect();
        }
      }, 1000);

      return redisClient;
    } catch(e) {
      // TO DO: Use a proper log service for this.
      console.log("Redis error", require("node:util").inspect(e));
    }
  }
}

module.exports = AppServiceProvider;
