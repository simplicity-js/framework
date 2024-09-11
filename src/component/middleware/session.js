"use strict";

const session = require("express-session");
const { v4: uuidv4 }  = require("uuid");


module.exports = function sessionMiddleware(config, store) {
  const sessConfig = config.get("session");
  const sessionConfig = {
    name: sessConfig.name,

    /*
     * secret is needed to sign the cookie
     */
    secret: sessConfig.secret,

    /*
     * generate a session ID.
     */
    genid: () => uuidv4(),
    resave: false,

    /*
     * true initializes a session for every user,
     * false initializes a session for only authenticated users
     */
    saveUninitialized: false,

    /*
     * Force session identifier cookie (max-age) to be (re-)set on every response
     */
    rolling: true,

    /*
     * Specify session cookie configuration
     */
    cookie: {
      domain: sessConfig.cookieDomain,

      /*
       * prevent client side JS from reading the cookie
       */
      httpOnly: true,

      /*
       * session max age in miliseconds
       */
      maxAge: sessConfig.expiry,

      /*
       * The path for which the session cookie is valid
       */
      path: sessConfig.cookiePath,

      /*
       * possible values: 'none', 'strict', 'lax'
       */
      sameSite: sessConfig.sameSite,

      /*
       * if true, serve secure cookies (i.e., only transmit cookie over https)
       */
      secure: sessConfig.secure,
    }
  };

  return session({ ...sessionConfig, store });
};
