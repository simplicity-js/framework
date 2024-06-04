const env = require("../dotenv");

const config = {
  database: {
    mongodb: {
      dsn      : env.DB_DSN,
      host     : env.DB_HOST,
      port     : env.DB_PORT,
      username : env.DB_USERNAME,
      password : env.DB_PASSWORD,
      dbName   : env.DB_DBNAME,
      debug    : false,
      exitOnConnectFail: true,
    },
  },
};

module.exports = config;
