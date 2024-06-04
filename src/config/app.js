const path = require("node:path");
const env = require("../dotenv");


const config = {
  app: {
    name        : env.NAME,
    host        : env.HOST,
    port        : env.PORT,
    environment : (env.NODE_ENV || "production").toLowerCase(),
    apiVersion  : env.API_VERSION,
    debugKey    : env.DEBUG_KEY,
    timezone    : (env.TIMEZONE || "UTC").toUpperCase(),
  },
};


module.exports = config;
