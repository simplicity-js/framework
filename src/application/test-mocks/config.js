const NodeCache = require("node-cache");
const APP_ROOT = require("app-root-path");
const SRC_DIR = `${APP_ROOT}/src`.replace(/\\/g, "/");

const cacheConfig = {
  default: "memory",
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

const sessionConfig = {
  name          : "connect.id",
  cookieDomain  : "localhost",
  cookiePath    : "/",
  expiry        : 1000 * 60 * 15,
  secret        : "secretString123",
  secure        : false,
  sameSite      : true,
  storageDriver : "memory",
};;

const config = {
  get(val) {
    switch(val) {
    case "app.name": return "simple framework";
    case "app.allowedOrigins": return ["*"];
    case "app.rootDir": return APP_ROOT; //path.dirname(path.dirname(path.dirname(__dirname))).replace(/\\/g, "/");
    case "app.srcDir" : return SRC_DIR;
    case "app.viewsDir": return `${SRC_DIR}/views`;
    case "app.viewTemplatesEngine": return "pug";
    case "cache": return cacheConfig;
    case "session": return sessionConfig;
    }
  },
};

module.exports = config;
