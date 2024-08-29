const util = require("node:util");
const { logger, marker } = require("./printer");


exports.printErrorMessage = function printErrorMessage(err, prefix) {
  const color = marker.error;
  const logMethod = err.logAs in logger ? err.logAs : "error";
  const errMessage = err.type === "libError"
    ? err.message
    : color.text(`${prefix}: ${util.format(err)}.`);

  logger[logMethod](errMessage);
};

/**
 * @param {String} message (required): The error message
 * @param {String} logType (optional): The logger method to call
 */
exports.throwLibraryError = function throwLibraryError(message, logType) {
  throw {
    message,
    type: "libError",
    logAs: logType ?? "error"
  };
};
