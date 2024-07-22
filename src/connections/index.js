const RedisStore = require("../component/connector/redis");
const MongooseStore = require("../component/connector/mongoose");
const SequelizeStore = require("../component/connector/sequelize");
const createObjectStore = require("../component/registry");

const registry = createObjectStore();

module.exports = class Connections {
  static get(key, options) {
    key = key.toLowerCase();

    if(!registry.contains(key)) {
      switch(key) {
      case "redis":
        registry.add(key, Connections.#connectToRedis(options));
        break;

      case "mongodb":
        registry.add(key, Connections.#connectToMongooseStore(options));
        break;

      case "memoryDb":
        registry.add(key, Connections.#connectToSequelizeStore(options));
        break;

      case "mariadb"  :
      case "mysql"    :
      case "postgres" :
      case"sqlite"    :
        registry.add(key, Connections.#connectToSequelizeStore(options));
        break;
      }
    }

    return registry.get(key);
  }

  static #connectToMongooseStore(options) {
    const mongooseStore = new MongooseStore(options);
    const mongooseClient = mongooseStore.getClient();

    setTimeout(async function() {
      if(!mongooseStore.connecting() && !mongooseStore.connected()) {
        await mongooseStore.connect();
      }
    }, 1000);

    return mongooseClient;
  }

  static #connectToSequelizeStore(options) {
    const sequelizeStore = new SequelizeStore(options);
    const sequelizeClient = sequelizeStore.getClient();

    setTimeout(async function() {
      if(!sequelizeStore.connected()) {
        await sequelizeStore.connect();
      }
    }, 1000);

    return sequelizeClient;
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
