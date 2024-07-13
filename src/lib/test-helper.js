/**
 * Newer versions of chai throw an error when we do `chai = require("chai")`:
 *  Exception during run: Error [ERR_REQUIRE_ESM]:
 *     require() of ES Module [PACKAGE_PATH]\node_modules\chai\chai.js from [TEST_PATH]\[TEST_FILE].spec.js not supported.
 *  Instead change the require of chai.js in [TEST_PATH]\[TEST_FILE].spec.js to a dynamic import()
 *     which is available in all CommonJS modules.
 *  at Object.<anonymous> ([TEST_PATH]\[TEST_FILE].spec.js:3:14) {
 *     code: 'ERR_REQUIRE_ESM'
 *  }
 *
 */
const chai = () => import("chai").then(chai => chai);
const chaiAsPromised = () => import("chai-as-promised").then(asPromised => asPromised.default);


module.exports = {
  chai,
  chaiAsPromised,
};
