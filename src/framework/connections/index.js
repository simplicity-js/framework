const RedisStore = require("../component/connector/redis");
const createObjectStore = require("../component/registry");

const registry = createObjectStore();

module.exports = class Connections {
  static get(key, options) {
    key = key.toLowerCase();

    if(!registry.contains(key)) {
      switch(key) {
      case "redis":
        registry.add("redis", Connections.#connectToRedis(options));
        break;
      }
    }

    return registry.get(key);
  }

  static #connectToRedis(redisCreds) {
    try {
      const redisStore = new RedisStore(redisCreds);
      const redisClient = redisStore.getClient();
      const log = Connections.#log.bind(Connections);

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

  static #log(message) {
    console.log(message);
  }
};
