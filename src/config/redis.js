const env = require("../dotenv");

module.exports = {
  url         : env.REDIS_URL,
  host        : env.REDIS_HOST,
  port        : env.REDIS_PORT,
  username    : env.REDIS_USERNAME,
  password    : env.REDIS_PASSWORD,
  db          : env.REDIS_DATABASE || "0",
  autoConnect : true,
};
