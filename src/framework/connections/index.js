const util = require("node:util");
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
    try {
      const mongooseStore = new MongooseStore(dbCreds);
      const mongooseClient = mongooseStore.getClient();

      setTimeout(async function() {
        if(!mongooseStore.connecting() && !mongooseStore.connected()) {
          await mongooseStore.connect();
        }
      }, 1000);

      return mongooseClient;
    } catch(e) {
      // TO DO: Use a proper log service for this.
      Connections.#log("Mongoose error", util.inspect(e));
    }
  }

  static #connectToRedis(redisCreds) {
    try {
      const redisStore = new RedisStore(redisCreds);
      const redisClient = redisStore.getClient();

      setTimeout(async function() {
        if(!redisStore.connecting() && !redisStore.connected()) {
          await redisStore.connect();
        }
      }, 1000);

      return redisClient;
    } catch(e) {
      // TO DO: Use a proper log service for this.
      Connections.#log("Redis error", util.inspect(e));
    }
  }

  static #log(message) {
    debug(message);
  }
};
