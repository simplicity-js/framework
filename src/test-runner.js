const fs = require("node:fs");
const path = require("node:path");

/*
 * Support specifying single file or single methods on the CLI for testing
 * e.g.:
 *   npm test -- --config           // Test only methods of the config module (src/config.js)
 *   npm test -- --config::get      // Test only the get method of the config module
 *   npm test -- --framework.router // Test only the methods of the router module (src/framework/router.js)
 *   npm test -- --framework.router::group // Test only the group method of the router
 */
const test = process.argv[process.argv.length - 1];
const singleFileTest = test.indexOf("--") > -1;

if(singleFileTest) {
  const singleMethodTest = test.indexOf("::") > -1;
  const indexEnd = singleMethodTest ? test.indexOf("::") : test.length;

  const testDir = test
    .substring(0, indexEnd)           // strip away the `::` method call indicator
    .replace("--", "")                // strip off the `--` single test indicator
    .replace(/([A-Z])/g, "-$1")       // replace CAPS with their lowercase equivalent to match the target test file name
    .replace(/^-/, "").toLowerCase()  // strip off the `-` preceding the first CAPS letter
    .split(".")                       // allow dot-separated directories (framework.router)
    .filter(Boolean)                  // remove empty members (e.g. `framework...router`, instead of framework.router)
    .join("/");                       // combine to form a directory path (framework.router => framework/router)

  const testFile = testDir + ".spec.js"; // append `.spec.js` to fully match the target file name
  const dirPath  = path.join(__dirname, testDir);
  const filePath = path.join(__dirname, testFile);

  if(fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
    runTestFile(path.join(testDir, testFile));
  } else if(fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    runTestFile(testFile);
  } else {
    throw new Error(`Invalid test "${test.replace("--", "")}"`);
  }
} else {
  fs.readdirSync(__dirname, { recursive: true })
    .filter(file => path.basename(file).endsWith(".spec.js"))
    .forEach(runTestFile);
}

after(function(done) {
  /*
   * Try to ensure outputs are flushed before exiting.
   * https://github.com/nodejs/node-v0.x-archive/issues/8329#issuecomment-54778937
   */
  process.nextTick(() => process.exit(0));

  done();
});

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
