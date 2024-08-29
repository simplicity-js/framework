"use strict";

const fs = require("node:fs");
const util = require("node:util");
const path = require("node:path");

function writeToLogFile(logFile, data) {
  fs.appendFileSync(logFile, data);
}


module.exports = function overrideConsoleDotLog(logFile) {
  const parentDir = path.dirname(logFile);

  if(!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  if(!fs.existsSync(logFile)) {
    fs.closeSync(fs.openSync(logFile, "w"));
  }

  const objects = ["log", "info", "warn", "error", "_stdout.write", "_stderr.write"];
  const originals = objects.reduce((originals, object) => {
    originals[object] = console[object];

    return originals;
  }, {});

  objects.forEach(object => {
    console[object] = function () {
      writeToLogFile(logFile, util.inspect(arguments, { depth: 12 }));
    };
  });

  return function restore() {
    objects.forEach(object => console[object] = originals[object]);
  };
};
