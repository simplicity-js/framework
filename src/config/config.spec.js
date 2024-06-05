/* eslint-env node, mocha */

const { chai } = require("../helpers/test-helper");
const config = require("./");

let expect;

before(async function() {
  expect = (await chai()).expect;
});

module.exports = {
  get: function get() {
    describe(".get(path, defaultValue)", function configGetSpec() {
      it("should get config value", function() {
        expect(config.get("app.environment")).to.equal("test");
        expect(config.get("app.timezone")).to.equal("UTC");
      });
    });
  },
};
