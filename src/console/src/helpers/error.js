const util = require("node:util");
const { marker, print } = require("./printer");

const PADDING = "  ";

exports.printErrorMessage = function printErrorMessage(err, prefix) {
  const color = marker.error;
  const errMessage = err.type === "libError"
    ? err.message
    : color.text(`${prefix}: ${util.format(err)}.`);

  print(`${PADDING}${color.background("ERROR")} ${errMessage}`);
};

exports.throwLibraryError = function throwLibraryError(message) {
  throw {
    type: "libError",
    message,
  };
};
