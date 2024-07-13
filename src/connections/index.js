const RedisStore = require("../component/connector/redis");
const MongooseStore = require("../component/connector/mongoose");
const createObjectStore = require("../component/registry");
const debug = require("../lib/debug");

const registry = createObjectStore();

module.exports = class Connections {
  static get(key, options) {
    key = key.toLowerCase();

    if(!registry.contains(key)) {
      switch(key) {
      case "redis":
        registry.add("redis", Connections.#connectToRedis(options));
        break;
      case "mongodb":
        registry.add("mongodb", Connections.#connectToMongoDb(options));
        break;
      }
    }

    return registry.get(key);
  }

  static #connectToMongoDb(dbCreds) {
    const mongooseStore = new MongooseStore(dbCreds);
    const mongooseClient = mongooseStore.getClient();

    setTimeout(async function() {
      if(!mongooseStore.connecting() && !mongooseStore.connected()) {
        await mongooseStore.connect();
      }
    }, 1000);

    return mongooseClient;
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

  static #log(message) {
    debug(message);
  }
};
