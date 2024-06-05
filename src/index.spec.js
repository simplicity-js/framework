/* eslint-env node, mocha */

const { chai } = require("./helpers/test-helper");

let expect;

before(async function() {
  expect = (await chai()).expect;
});


module.exports = {
  index: function index() {
    it("should pass", function() {
      expect(true).to.equal(true);
    });
  }
};
