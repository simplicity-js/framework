const APP_ROOT = require("./app-root");

require("dotenv").config({ path: `${APP_ROOT}/.env` });

const { env } = process;

module.exports = env;
