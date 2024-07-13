const env = require("../framework/env");

module.exports = {
  url         : env("REDIS_URL"),
  host        : env("REDIS_HOST", "localhost"),
  port        : env("REDIS_PORT", 6379),
  username    : env("REDIS_USERNAME", "default"),
  password    : env("REDIS_PASSWORD"),
  db          : env("REDIS_DATABASE", "0"),
  autoConnect : true,
};
