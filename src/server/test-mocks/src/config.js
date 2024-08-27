const path = require("node:path");
const NodeCache = require("node-cache");
const pkg = require("../../../../package.json");
const APP_ROOT = path.dirname(__dirname); //require("app-root-path");
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

const databaseConfig = {
  default: "sqlite",

  connections: {
    sqlite: {
      dbEngine    : "sqlite",
      dbName      : "test.sqlite",
      logging     : false,
      storagePath : "../../.sqlite",
    },
  },
};

const logConfig = {
  logExceptions : false,
  logRejections : false,
  logToConsole  : false,
  logToFile     : true,
  logDir: "../../.logs",
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
    case "app.name": return pkg.name;
    case "app.allowedOrigins": return ["*"];
    case "app.rootDir": return APP_ROOT; //path.dirname(path.dirname(path.dirname(__dirname))).replace(/\\/g, "/");
    case "app.srcDir" : return SRC_DIR;
    case "app.maintenance": return { driver: "file" };
    case "app.version": return pkg.version;
    case "app.viewsDir": return `${SRC_DIR}/views`;
    case "app.viewTemplatesEngine": return "pug";
    case "cache": return cacheConfig;
    case "database": return databaseConfig;
    case "logging": return logConfig;
    case "session": return sessionConfig;
    }
  },
};

module.exports = config;
