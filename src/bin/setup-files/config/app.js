const path = require("node:path");
const env = require("../framework/env");
const is = require("../framework/lib/is");
const string = require("../framework/lib/string");

const SPLIT_REGEX = /[\s+,;|]+/;
const APP_ROOT = string.convertBackSlashToForwardSlash(path.resolve(path.dirname(__dirname), ".."));
const APP_SRC_DIR = `${APP_ROOT}/src`;
const HTTP_REGEX  = /^https?:\/\//i;

let host = env("HOST");
let port = env("PORT");
let scheme = env("URL_SCHEME", "http")?.toLowerCase();

if(!(/^https?(:\/\/)?/.test(scheme))) {
  scheme = "http://";
}

scheme = scheme.split(/:\/\//)[0] + "://";
host  = (HTTP_REGEX.test(host)) ? host: `${scheme}${host}`;
port  = [80, 443].includes(Number(port)) ? "" : port;

module.exports = {
  name        : env("NAME"),
  host        : env("HOST"),
  port        : env("PORT"),
  url         : port ? `${host}:${port}` : host,
  urlScheme   : scheme,
  environment : env("NODE_ENV", "production").toLowerCase(),
  apiVersion  : env("API_VERSION"),
  debug       : is.falsy(env("DEBUG").toLowerCase()) ? false : true,
  timezone    : env("TIMEZONE", "UTC").toUpperCase(),
  rootDir     : APP_ROOT,
  srcDir      : APP_SRC_DIR,
  viewsDir    : `${APP_SRC_DIR}/${env("VIEWS_DIR", "views")}`,
  allowedHeaders : env("ALLOWED_HEADERS").split(SPLIT_REGEX).map(s => s.trim()),
  allowedMethods : env("ALLOWED_METHODS").split(SPLIT_REGEX).map(o => o.trim().toUpperCase()),
  allowedOrigins : env("ALLOWED_ORIGINS").split(SPLIT_REGEX).map(o => o.trim()),
  viewTemplatesEngine: env("VIEW_TEMPLATES_ENGINE"),
};
