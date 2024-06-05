const fs = require("node:fs");
const path = require("node:path");
const fileSystem = require("./helpers/file-system");
const test = process.argv[process.argv.length - 1]; // e.g.: --config, --config::get, etc.
const runSingleTest = test.indexOf("--") > -1;
const runMethodTest = test.indexOf("::") > -1;
const allFiles = fs.readdirSync(__dirname, { recursive: true });
const testFiles = allFiles.filter(file => path.basename(file).endsWith(".spec.js"));
const indexEnd = runMethodTest ? test.indexOf("::") : test.length;


if(runSingleTest) {
  const testDir = test
    .substring(0, indexEnd)           // strip away the `::` method call indicator
    .replace("--", "")                // strip off the `--` single test indicator
    .replace(/([A-Z])/g, "-$1")       // replace CAPS with their lowercase equivalent to match the target test file name
    .replace(/^-/, "").toLowerCase(); // strip off the `-` preceding the first CAPS letter

  const testFile = testDir + ".spec.js"; // append `.spec.js` to fully match the target file name

  if(fileSystem.isDirectory(path.join(__dirname, testDir))) {
    runTestFile(path.join(testDir, testFile));
  } else if(fileSystem.isFile(path.join(__dirname, testFile))) {
    runTestFile(testFile);
  }
} else {
  testFiles.forEach(runTestFile);
}

function runTestFile(testFile) {
  const [, method] = test.split("::"); // e.g., config::get
  const methods    = require(path.join(__dirname, testFile));
  const testName   = path.basename(testFile, ".spec.js");

  describe(testName, function() {
    // * means: run all methods in the specified file (config::*)
    // This was created to handle cases when we want to run
    // only the tests of config. Doing npm test -- --config
    // results in npm thinking we are passing config info and returning error:
    // Error: Not enough arguments following: config
    // Using config::* (or similar) enables us to achieve our
    // desired functionality.
    if(method && method !== "*") {
      if(methods[method]) {
        methods[method]();
      } else {
        throw new Error(`Test "${method}" not found in file "${testFile}"`);
      }
    } else {
      Object.keys(methods).forEach(function test(method) {
        methods[method]();
      });
    }
  });
}
