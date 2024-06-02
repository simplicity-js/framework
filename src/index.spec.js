/* eslint-env node, mocha */

const { runTest: test } = require("./helpers/test-helper");


describe("Index", function() {
  it("should pass", function() {
    test(function({ expect }) {
      expect(true).to.equal(true);
    });
  });
});
