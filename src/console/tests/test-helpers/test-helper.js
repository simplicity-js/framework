"use strict";

const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");
const sinon = require("sinon");
const chai = () => import("chai").then(chai => chai);
const getReplaceInFile = () => import("replace-in-file").then(rif => rif);
const { copy, createDirectory, createFile, deleteFileOrDirectory } = require(
  "../../src/helpers/file-system");

const testsDir = path.resolve(__dirname, "..").replace(/\\/g, "/");
const testAppDir = `${testsDir}${path.sep}test-app`;
const logDir  = `${testsDir}/.logs`;
const logFile = `${logDir}/console.log`;
const errFile = `${logDir}/console.error`;

before(function(done) {
  copy(
    `${testAppDir}${path.sep}.env.example`,
    `${testAppDir}${path.sep}.env`
  );
  done();
});

after(function(done) {
  deleteFileOrDirectory(`${testAppDir}${path.sep}.env`);

  /*
   * Ensure output is flushed before exiting.
   * https://github.com/nodejs/node-v0.x-archive/issues/8329#issuecomment-54778937
   */
  process.nextTick(() => process.exit(0));
  done();
});

(createDirectory(logDir) && createFile(logFile) && createFile(errFile)) || process.exit(1);

function spyOnConsoleOutput(object = "stdout") {
  object = `_${object}`;

  const originalMethod = console[object].write.bind(console[object]);

  // Overwrite the console._stdout.write used by our printer object internally.
  // So that it doesn't write to the actual console, cluttering our screen.
  // Instead, it writes to an output file.
  console[object].write = function() {
    fs.appendFileSync(logFile, util.inspect(arguments, { depth: 12 }));
  };

  // Handle console output due to migrate-mongoose package
  // using an older version of mongoose. Handle any other such cases
  // that might arise from pacakges we have no control over.
  const oldConsoleError = console.error;
  console.error = function() {
    fs.appendFileSync(errFile, util.inspect(arguments, { depth: 12 }));
  };

  // Handle ora spinner output
  const originalOraStream = process.stderr.write;
  process.stderr.write = function() {
    fs.appendFileSync(errFile, util.inspect(arguments, { depth: 12 }));
  };

  // spy on the overwritten console method
  const consoleSpy = sinon.spy(console[object], "write");

  return {
    sinonSpy: consoleSpy,
    restore: function() {
      // Restore the sinon spy and the original console method
      // so that the test result will be output to the screen, not to the file.
      sinon.restore();
      console[object].write = originalMethod;
      console.error = oldConsoleError;
      process.stderr.write = originalOraStream;
    }
  };
}

async function normalizeMongooseMigrationFilesForTesting(appDir, modelName) {
  const replacer = await getReplaceInFile();

  await replacer.replaceInFile({
    files: `${appDir}/src/database/migrations/mongoose/*.js`,
    from: `require("app/http/models/mongoose/${modelName.toLowerCase()}")`,
    to: `require("../../../app/http/models/mongoose/${modelName.toLowerCase()}")`,
  });
}

module.exports = {
  chai,
  spyOnConsoleOutput,
  normalizeMongooseMigrationFilesForTesting,
};
