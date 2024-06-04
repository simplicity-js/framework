const env = require("../dotenv");

const config = {
  logtail: {
    sourceToken: env.LOGTAIL_SOURCE_TOKEN,
  },
};

module.exports = config;
