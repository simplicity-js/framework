const winston  = require("winston");
require("winston-daily-rotate-file");


module.exports = class LoggerFactory {
  /* Features:
   * It should let the user customize the level colours
   * It should let the user add custom log transports [Array/List of transports].
   * It should let the user specify if they want it to log uncaught exceptions
   *    and what transports to use (or whether to use same transport as for regular logging)
   * It should let the user specify if they want it to log uncaught promise rejections
   *    and what transports to use
   *    (or whether to use same transport as for regular logging or uncaught exceptions)
   */

  /*
   * Events on rotating transport
   * // fired when a log file is created
   * fileRotateTransport.on('new', (filename) => {});
   * // fired when a log file is rotated
   * fileRotateTransport.on('rotate', (oldFilename, newFilename) => {});
   * // fired when a log file is archived
   * fileRotateTransport.on('archive', (zipFilename) => {});
   * // fired when a log file is deleted
   * fileRotateTransport.on('logRemoved', (removedFilename) => {});
   */

  /**
   * @param {Object} options
   * @param {String} [options.label]
   * @param {Array} [options.levels]
   * @param {Boolean} [options.logToFile]
   * @param {String} [options.logDir]: The directory to log to if logToFile is true.
   * @param {Boolean} [options.disableConsoleLogs]
   * @param {Array} [options.transports]: Array of winstorn transports. Default is [Console]
   * @param {Boolean} [options.logExceptions]
   * @param {Array} [options.exceptionHandlers]
   * @param {Boolean} [options.logRejections]
   * @param {Array} [options.rejectionHandlers]
   * @return {Object} Winston Logger instance
   */
  static createLogger(options) {
    const {
      label = "FrameworkLogger",
      levels,
      logDir,
      logToFile,
      logExceptions,
      logRejections,
      disableConsoleLogs,
      transports: customTransports = [],
    } = options || {};

    let { exceptionHandlers, rejectionHandlers } = options || {};

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
      if(!Array.isArray(exceptionHandlers)) {
        exceptionHandlers = transports;
      }
    }

    if(logRejections) {
      if(!Array.isArray(rejectionHandlers)) {
        rejectionHandlers = transports;
      }
    }

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
      defaultMeta: { service: label },
      exitOnError: false,
    });

    winston.addColors({
      debug : "blue",
      error : "red",
      http  : "gray",
      info  : "green",
      warn  : "yellow",
    });

    /*
     * Log to the `console` with the format:
     * `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
     */
    if(!disableConsoleLogs) {
      logger.add(new winston.transports.Console({
        format: winston.format.simple(),
      }));
    }

    return logger;


    // Private Helper functions
    /**
     * A common need that Winston does not enable by default
     * is the ability to log each level into different files (or transports)
     * so that only info messages go to, for example, an `app-info.log` file,
     * debug messages into an `app-debug.log file`, and so on.
     * To get around this, we create a custom format on the transport to filter the messages by level.
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
     *     filename: 'app-others.log',
     *     level: 'error',
     *     format: combine(levelFilter(["debug", "info", ...])(), timestamp(), json()),
     *   }),
     * ]
     */
    /*function createLevelFilter(infoLevels, availableLevels = npm.levels) {
      let levels;

      if(typeof infoLevels === "string") {
        levels = infoLevels.split(/\s+,\s+/).map(Boolean);
      }

      if(!Array.isArray(levels)) {
        throw new TypeError(
          `Invalid log level ${levels} specified. ` +
          `Supported log levesl are ${availableLevels.join(", ")}`
        );
      }

      return winston.format((info, opts) => {
        return levels.includes(info.level) ? info : false;
      });
    }*/

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
};
