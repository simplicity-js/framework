const RedisStore = require("../component/connector/redis");
const DatabaseFactory = require("../factory/database");
const createObjectStore = require("../component/registry");

const registry = createObjectStore();

module.exports = class Connections {
  static async get(key, options) {
    key = key.toLowerCase();

    if(key === "mongodb") {
      if(options?.orm?.toLowerCase() === "mongoose") {
        key = "mongodb:mongoose";
      } else {
        key = "mongodb:sequelize";
      }
    }

    if(!registry.contains(key)) {
      switch(key) {
      case "redis":
        registry.add(key, Connections.#connectToRedis(options));
        break;

      case "memoryDb":
        registry.add(key, await Connections.#connectToDatabase("memory", options));
        break;

      case "mongodb":
        registry.add(key, await Connections.#connectToDatabase("mongodb", options));
        break;

      case "mariadb"  :
      case "mysql"    :
      case "postgres" :
      case"sqlite"    :
        registry.add(key, await Connections.#connectToDatabase(key, options));
        break;
      }
    }

    return registry.get(key);
  }

  static async #connectToDatabase(driver, config) {
    const dbStore = await DatabaseFactory.createDatastore(driver, config);
    return dbStore.getClient();
  }

  static #connectToRedis(redisCreds) {
    const redisStore = new RedisStore(redisCreds);
    const redisClient = redisStore.getClient();

    setTimeout(async function() {
      if(!redisStore.connecting() && !redisStore.connected()) {
        await redisStore.connect();
      }
    }, 1000);

    return redisClient;
  }
};
