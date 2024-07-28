"use strict";

const fs = require("node:fs");
const util = require("node:util");


module.exports = function overrideConsoleDotLog(outputFile) {
  const consoleOutputFile = outputFile;
  const oldLog = console.log;

  console.log = function () {
    // Write to the console output capture file
    try {
      fs.appendFileSync(consoleOutputFile, util.inspect(arguments, { depth: 12 }));
    } catch (err) {
      console.error(err);
    }

    // Invoke the original console.log
    //oldLog.apply(console, arguments);
  };

  return function restore() {
    console.log = oldLog;
  };
};
