const env = require("../dotenv");

const config = {
  redis: {
    dsn         : env.REDIS_DSN,
    host        : env.REDIS_HOST,
    port        : env.REDIS_PORT,
    username    : env.REDIS_USERNAME,
    password    : env.REDIS_PASSWORD,
    db          : env.REDIS_DATABASE,
    autoConnect : true,
  },
};

module.exports = config;
