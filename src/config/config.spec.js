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
      it("should return `path` config value if exists", function() {
        expect(config.get("database")).to.deep.equal({
          default: "mongodb",
          connections: {
            mongodb: {
              dsn      : "",
              host     : "0.0.0.0",
              port     : 27017,
              username : "",
              password : "",
              dbName   : "",
              debug    : false,
              exitOnConnectFail: true,
            },
          },
        });
      });

      it("should return dot-separated `path` config value if exists", function() {
        expect(config.get("app.environment")).to.equal("test");
        expect(config.get("app.timezone")).to.equal("UTC");
      });

      it("should return `path` config value in favour of `defaultValue` if exists", function() {
        expect(config.get("database.default", "mysql")).to.equal("mongodb");
      });

      it("should return `defaultValue` if no config exists for given `path`", function() {
        expect(config.get("host", "system")).to.equal("system");
      });
    });
  },
};
