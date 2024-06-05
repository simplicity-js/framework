const env = require("../dotenv");

module.exports = {
  name         : env.SESSION_NAME,
  cookieDomain : env.SESSION_COOKIE_DOMAIN,
  cookiePath   : env.SESSION_COOKIE_PATH,
  expiry       : 1000 * 60 * Number(env.SESSION_EXPIRY),
  secret       : env.SESSION_SECRET,
  sameSite     : env.SESSION_SAME_SITE,
};
