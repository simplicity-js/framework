const env = require("../framework/env");
const is = require("../framework/lib/is");

module.exports = {
  name          : env("SESSION_NAME", "connect.sid"),
  cookieDomain  : env("SESSION_COOKIE_DOMAIN"),
  cookiePath    : env("SESSION_COOKIE_PATH", "/"),
  expiry        : 1000 * 60 * Number(env("SESSION_EXPIRY", 15)),
  secret        : env("SESSION_SECRET"),
  secure        : is.falsy(env("SESSION_SECURE").toLowerCase()) ? false : true,
  sameSite      : env("SESSION_SAME_SITE"),
  storageDriver : env("SESSION_STORE_DRIVER", "memory").toLowerCase(),
};
