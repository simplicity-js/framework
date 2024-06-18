const path = require("node:path");
const env = require("../dotenv");
const is = require("../framework/lib/is");
const string = require("../framework/lib/string");

const SPLIT_REGEX = /[\s+,;|]+/;
const APP_ROOT = string.convertBackSlashToForwardSlash(path.resolve(path.dirname(__dirname), ".."));
const APP_SRC_DIR = `${APP_ROOT}/src`;

module.exports = {
  name        : env.NAME,
  host        : env.HOST,
  port        : env.PORT,
  environment : (env.NODE_ENV || "production").toLowerCase(),
  apiVersion  : env.API_VERSION,
  debug       : is.falsy(env.DEBUG?.trim()?.toLowerCase()) ? false : true,
  timezone    : (env.TIMEZONE || "UTC").toUpperCase(),
  rootDir     : APP_ROOT,
  srcDir      : APP_SRC_DIR,
  viewsDir    : `${APP_SRC_DIR}/${(env.VIEWS_DIR || "views")}`,
  allowedHeaders : env.ALLOWED_HEADERS.split(SPLIT_REGEX).map(s => s.trim()),
  allowedMethods : env.ALLOWED_METHODS.split(SPLIT_REGEX).map(o => o.trim().toUpperCase()),
  allowedOrigins : env.ALLOWED_ORIGINS.split(SPLIT_REGEX).map(o => o.trim()),
  viewTemplatesEngine: env.VIEW_TEMPLATES_ENGINE,
};
