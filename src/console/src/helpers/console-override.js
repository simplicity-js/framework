"use strict";

const fs = require("node:fs");
const util = require("node:util");
const path = require("node:path");


module.exports = function overrideConsoleDotLog(logFile) {
  const parentDir = path.dirname(logFile);

  if(!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if(!fs.existsSync(logFile)) {
    fs.closeSync(fs.openSync(logFile, "w"));
  }

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalError = console.error;

  console.info = function () {
    writeToLogFile(logFile, util.inspect(arguments, { depth: 12 }));
  };

  console.log = function () {
    writeToLogFile(logFile, util.inspect(arguments, { depth: 12 }));

    // Invoke the original console.log
    //originalLog.apply(console, arguments);
  };

  console.error = function () {
    writeToLogFile(logFile, util.inspect(arguments, { depth: 12 }));
  };


  return function restore() {
    console.log = originalLog;
    console.info = originalInfo;
    console.error = originalError;
  };


  function writeToLogFile(logFile, data) {
    fs.appendFileSync(logFile, data);
  }
};
