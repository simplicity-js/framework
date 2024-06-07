const path = require("node:path");
const env = require("../dotenv");
const is = require("../helpers/is");
const string = require("../helpers/string");

const SPLIT_REGEX = /[\s+,;|]+/;

module.exports = {
  name        : env.NAME,
  host        : env.HOST,
  port        : env.PORT,
  environment : (env.NODE_ENV || "production").toLowerCase(),
  apiVersion  : env.API_VERSION,
  debug       : is.falsy(env.DEBUG?.trim()?.toLowerCase()) ? false : true,
  timezone    : (env.TIMEZONE || "UTC").toUpperCase(),
  rootDir     : string.convertBackSlashToForwardSlash(path.resolve(path.dirname(__dirname), "..")),
  allowedHeaders : env.ALLOWED_HEADERS.split(SPLIT_REGEX).map(s => s.trim()),
  allowedMethods : env.ALLOWED_METHODS.split(SPLIT_REGEX).map(o => o.trim().toUpperCase()),
  allowedOrigins : env.ALLOWED_ORIGINS.split(SPLIT_REGEX).map(o => o.trim()),
  viewTemplatesEngine: env.VIEW_TEMPLATE_ENGINE,
};
