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
const singleFileOrDirectoryTest = test.indexOf("--") > -1;

after(function(done) {
  /*
   * Try to ensure outputs are flushed before exiting.
   * https://github.com/nodejs/node-v0.x-archive/issues/8329#issuecomment-54778937
   */
  process.nextTick(() => process.exit(0));

  done();
});


if(singleFileOrDirectoryTest) {
  const singleMethodTest = test.indexOf("::") > -1;
  const indexEnd = singleMethodTest ? test.indexOf("::") : test.length;

  const testDir = test
    .substring(0, indexEnd)      // strip away the `::` method call indicator
    .replace("--", "")           // strip off the `--` single test indicator
    .replace(/([A-Z])/g, "-$1")  // replace CAPS ...
    .toLowerCase()               // ... with their lowercase equivalent to match the target test file name
    .replace(/^-/, "")           // strip off the `-` preceding the first CAPS letter
    .replace(/(\.)-/, "$1")      // replace something like providers.-app-* with providers.app-*
    .split(".")                  // allow dot-separated directories (framework.router)
    .filter(Boolean)             // remove empty members (e.g. `framework...router`, instead of framework.router)
    .join("/");                  // combine to form a directory path (framework.router => framework/router)

  const testFile = testDir + ".spec.js"; // append `.spec.js` to fully match the target file name
  const dirPath  = path.join(__dirname, testDir);
  const filePath = path.join(__dirname, testFile);

  if(fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
    runTestsInDirectory(dirPath);
  } else if(fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    const filename = path.basename(testFile);
    const parentDir = filePath.replace(filename, "");

    runTestFile(filename, parentDir);
  } else {
    throw new Error(`Invalid test "${test.replace("--", "")}"`);
  }
} else {
  runTestsInDirectory(__dirname);
}

function runTestFile(testFile, parentDir) {
  const [, method] = test.split("::"); // e.g., config::get
  const methods    = require(path.join(parentDir, testFile));
  const filename   = path.basename(testFile, ".spec.js");
  const testName   = filename
    .replace(/[_-]+([a-z])/g, (str, char) => char.toUpperCase())
    .replace(filename[0], filename[0].toUpperCase());

  const dirBase = parentDir
    .substring(parentDir.indexOf("src"))
    .replace(/\\/g, "/")
    .replace(/\/$/, "");
  const filepath = testFile.replace(/\\/g, "/");

  describe(`${testName} (${dirBase}/${filepath})`, function() {
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

function runTestsInDirectory(directory) {
  fs.readdirSync(directory, { recursive: true })
    .filter(file => !file.includes(`node_modules${path.sep}`))
    .filter(file => path.basename(file).endsWith(".spec.js"))
    .forEach(file => runTestFile(file, directory));
}
