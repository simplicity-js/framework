const url = require("node:url");


/**
 * Validate connection options to resources like redis, mongodb, mysql, etc.
 *
 * @param {Object|String} options: The connection options object or the connection URL.
 * @param {Object} config
 * @param {Object} [config.driver]: The connection driver (redis, mongoodb, mysql, etc).
 * @param {Object} [config.defaults]: Key-value pairs of defaults for fields not supplied by the client.
 * @param {Array} [config.required]: List of required fields.
 * @return {Object} the configuration object for connecting to the resource.
 * @throws {TypeError} if the options parameter is a string that could not be parsed
 *   according to the [config.]driver's rules.
 *
 * Usage example:
 * validateConnectionOptions({}|"", {
 *   driver: "redis",
 *   defaults: { host: localhost, port: 6379, user: default },
 *   required: ["host", "port"]
 * })
 */
module.exports = function validateConnectionOptions(options, { driver, defaults, required }) {
  const config = {};

  if(typeof options === "string") {
    const o = url.parse(options);

    if(o.protocol === `${driver}:`) {
      for(const prop of Object.entries(defaults)) {
        config[prop] = o[prop] || defaults[prop];
      }
    } else {
      throw new TypeError(`Unable to parse ${o} as ${protocol} connection string!`);
    }
  } else {
    for(const prop of Object.keys(options)) {
      config[prop] = options[prop] ?? defaults[prop];
    }
  }

  for(const prop of required) {
    if(typeof config[prop] === "undefined") {
      throw new TypeError(`The "${prop}" field is required`);
    }
  }

  return config;
};
