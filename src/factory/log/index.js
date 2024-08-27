const winston  = require("winston");
require("winston-daily-rotate-file");


module.exports = class LogFactory {
  /**
   * @param {Object} options
   * @param {String} [options.label]
   * @param {Array} [options.levels]
   * @param {Boolean} [options.logToFile]
   * @param {String} [options.logDir]: The directory to log to if logToFile is true.
   * @param {Boolean} [options.logToConsole]
   * @param {Array} [options.transports]: Array of winstorn transports. Default is [Console]
   * @param {Boolean} [options.logExceptions]
   * @param {Array} [options.exceptionHandlers]
   * @param {Boolean} [options.logRejections]
   * @param {Array} [options.rejectionHandlers]
   * @return {Object} Winston Logger instance
   */
  static createLogger(options) {
    const {
      label,
      levels,
      logDir,
      logToFile,
      logToConsole,
      logExceptions,
      logRejections,
      transports: customTransports = [],
    } = options || {};

    let exceptionHandlers;
    let rejectionHandlers;
    const consoleTransport = new winston.transports.Console({
      format: winston.format.simple(),
    });
    const transports = [].concat(customTransports);

    if(logToFile) {
      if(!logDir) {
        throw new TypeError(
          "The 'logToFile' option requires a 'logDir' options to be specified."
        );
      }

      const logFileConfig = {
        dirname       : logDir,
        filename      : "%DATE%.application.log",
        datePattern   : "YYYY-MM-DD-HH",
        maxSize       : "5m",
        maxFiles      : "30d",
        utc           : true,
        zippedArchive : true,
      };
      const combinedFileTransport = new winston.transports.DailyRotateFile(logFileConfig);
      const errorFileTransport = new winston.transports.DailyRotateFile({
        ...logFileConfig,
        filename: "%DATE%.application.error.log",
        level: "error",
      });

      transports.push(combinedFileTransport, errorFileTransport);
    }

    if(logExceptions) {
      if(logToConsole) {
        // Cf. https://github.com/winstonjs/winston/issues/1289#issuecomment-396527779
        consoleTransport.handleExceptions = true;
        exceptionHandlers = transports.concat([consoleTransport]);
      } else {
        exceptionHandlers = transports;
      }
    }

    if(logRejections) {
      if(logToConsole) {
        // Cf. https://github.com/winstonjs/winston/issues/1289#issuecomment-396527779
        consoleTransport.handleRejections = true;
        exceptionHandlers = transports.concat([consoleTransport]);
      } else {
        exceptionHandlers = transports;
      }
    }

    const logLevels = levels || winston.config.npm.levels;
    const levelKeys = Object.keys(logLevels);
    const formats = winston.format.combine(
      winston.format.label({ label, message: true }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.timestamp(),
      winston.format.colorize({ all: true }),
      winston.format.align(),
      winston.format.json(),
      winston.format.printf(customFormatter),
    );
    const logger = winston.createLogger({
      levels,
      formats,
      transports,
      exceptionHandlers,
      rejectionHandlers,
      level: levelKeys[levelKeys.length - 1], // Make all the levels available to the client.
      defaultMeta: { service: label ?? "FrameworkLogger" },
      exitOnError: false,
    });

    /*
     * Log to the `console` with the format:
     * `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
     */

    /*
     * Make the console the default transport unless the user disabled it
     */
    if(transports.length === 0 && typeof logToConsole === "undefined") {
      logger.add(consoleTransport);
    } else if(logToConsole) {
      logger.add(consoleTransport);
    }

    winston.addColors({
      debug: "blue",
      error: "red",
      http: "gray",
      info: "green",
      warn: "yellow"
    });

    return logger;


    // Private Helper functions
    function customFormatter(info) {
      return JSON.stringify({
        service: label,
        timestamp: info.timestamp,
        pid: process.pid,
        level: info.level,
        message: info.message
      });
    }
  }

  /**
   * A common need that Winston does not enable by default
   * is the ability to log each level into different files (or transports)
   * such that only info messages go to, for example, an `app-info.log` file,
   * debug messages go into an `app-debug.log file`, and so on.
   * To get around this, we can create a custom format on the transport
   * to filter the messages by level.
   *
   * @param {Array|String} logLevels: An array or comma-separated list
   *   of the log priority levels.
   * @param {Object} logPriorityProtocol: The protocol that defines the
   *   available log levels. The default is `winston.npm.levels`.
   *
   * USAGE EXAMPLE:
   * transports: [
   *   new winston.transports.File({
   *     filename: 'app-error.log',
   *     level: 'error',
   *     format: combine(levelFilter("error")(), timestamp(), json()),
   *   }),
   *
   *   new winston.transports.File({
   *     filename: 'app-debug.log',
   *     level: 'error',
   *     format: combine(levelFilter("debug")(), timestamp(), json()),
   *   }),
   *
   *   new winston.transports.File({
   *     filename: 'app-others.log',
   *     level: 'error',
   *     format: combine(levelFilter(["info", ...])(), timestamp(), json()),
   *   }),
   * ]
   */
  static levelFilter(logLevels, availableLevels = winston.npm.levels) {
    let levels;

    if(typeof logLevels === "string") {
      levels = logLevels.split(/\s+,\s+/).map(Boolean);
    }

    if(!Array.isArray(levels)) {
      throw new TypeError(
        `Invalid log level ${levels} specified. ` +
        `Supported log levesl are ${availableLevels.join(", ")}`
      );
    }

    return winston.format((info) => levels.includes(info.level) ? info : false);
  }
};
