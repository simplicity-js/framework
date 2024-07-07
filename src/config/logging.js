const env = require("../framework/env");
const is = require("../framework/lib/is");


module.exports = {
  logExceptions : is.falsy(env("LOG_UNCAUGHT_EXCEPTIONS")) ? false : true,
  logRejections : is.falsy(env("LOG_PROMISE_REJECTIONS")) ? false : true,
  logToConsole  : is.falsy(env("LOG_TO_CONSOLE")) ? false : true,
  logToFile     : is.falsy(env("LOG_TO_FILE")) ? false : true,

  // Required if the `logToFile` option is true.
  // The directory (relative to the root directory)
  // to place log files if logToFile is enabled.
  logDir: env("LOG_DIRECTORY", ".logs"),


  /*
   *--------------------------------------------------------------------------
   * Log Channels
   *--------------------------------------------------------------------------
   *
   * Here you may configure the log channels for your application. Out of
   * the box, Simple Framework uses the Winston logging library. This gives
   * you a variety of powerful log handlers to utilize.
   *
   * For example (Using LogTail):
   * const { Logtail } = require("@logtail/node");
   * const { LogtailTransport } = require("@logtail/winston");
   *
   * const logtail = new Logtail(YOUR_LOGTAIL_SOURCE_TOKEN);
   */
  channels: [
    /* new LogtailTransport(logtail), */
  ],
};
