const morgan = require("morgan");


module.exports = function logHttpRequests(app) {
  let loggerMiddleware;
  let logger;

  try {
    logger = app.resolve("logger");
  } catch {
    logger = console;
  }

  /*
   * If the logger is using log levels different from winston.config.npm.levels,
   * we may not have the logger.http method. In that case,
   * we fallback to using morgan('tiny') which is an alias for
   * morgan(":method :url :status :res[content-length] - :response-time ms").
   */
  if(typeof logger?.http !== "function") {
    loggerMiddleware = morgan("tiny");
  } else {
    const config = {
      stream: {
        /*
         * Configure Morgan to use our custom (winston)
         * logger with the http severity
         */
        write: (message) => logger.http("incoming-request", JSON.parse(message)),
      },
    };

    loggerMiddleware = morgan(formatter, config);
  }

  return loggerMiddleware;
};

function formatter(tokens, req, res) {
  return JSON.stringify({
    method         : tokens.method(req, res),
    url            : tokens.url(req, res),
    ip_address     : tokens["remote-addr"](req, res),
    status         : Number.parseFloat(tokens.status(req, res)),
    content_length : tokens.res(req, res, "content-length"),
    response_time  : Number.parseFloat(tokens["response-time"](req, res)),
  });
}
