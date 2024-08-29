"use strict";

const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");
const sinon = require("sinon");
const chai = () => import("chai").then(chai => chai);
const getReplaceInFile = () => import("replace-in-file").then(rif => rif);
const { copy, createDirectory, createFile, deleteFileOrDirectory } = require(
  "../../src/helpers/file-system");

const testsDir = path.dirname(__dirname).replace(/\\/g, "/");
const testAppStub = `${testsDir}/test-app-stub`;
const testAppDir = `${testsDir}/test-app`;
const logDir  = `${testsDir}/.logs`;
const logFile = `${logDir}/console.log`;
const errFile = `${logDir}/console.error`;

before(function(done) {
  deleteFileOrDirectory(testAppDir);
  copy(testAppStub, testAppDir);
  copy(
    `${testAppDir}/.env.example`,
    `${testAppDir}/.env`
  );

  if(process.cwd() !== testAppDir) {
    process.chdir(testAppDir);
  }

  done();
});

after(function(done) {
  deleteFileOrDirectory(testAppDir);

  /*
   * Ensure output is flushed before exiting (call to done()).
   * https://github.com/nodejs/node-v0.x-archive/issues/8329#issuecomment-54778937
   */
  process.nextTick(() => process.exit(0));
  done();
});

(createDirectory(logDir) && createFile(logFile) && createFile(errFile)) || process.exit(1);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

async function dropCollections(connection, collectionNames) {
  if(Array.isArray(collectionNames)) {
    await Promise.all(collectionNames.map((collectionName) => {
      return connection.dropCollection(collectionName);
    }));
  } else {
    const collections = await connection.db.collections();

    await Promise.all(collections.map((collection) => {
      const collectionName = collection.s.namespace.collection;

      return connection.dropCollection(collectionName);
    }));
  }
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
  dropCollections,
  escapeRegExp,
  spyOnConsoleOutput,
  normalizeMongooseMigrationFilesForTesting,
};
