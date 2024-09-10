"use strict";

/* eslint-env node, mocha */

const { chai } = require("./lib/test-helper");
const createConfig = require("./config")();

let expect;
const config = createConfig(`${__dirname.replace(/\\/g, "/")}/server/test-mocks/src/config`, []);
const defaultDbConfig = {
  default: "sqlite",
  connections: {
    sqlite: {
      dbEngine    : "sqlite",
      dbName      : "simplicity_db",
      logging     : false,
      storagePath : "app/database",
    },
  },
};

before(async function() {
  expect = (await chai()).expect;
});

module.exports = {
  get() {
    describe(".get(path[, defaultValue])", function configDotGet_Spec() {
      it("should return `path` config value if exists", function() {
        expect(config.get("database")).to.deep.equal(defaultDbConfig);
      });

      it("should return dot-separated `path` config value if exists", function() {
        expect(config.get("app.environment")).to.equal("test");
        expect(config.get("app.timezone")).to.equal("UTC");
      });

      it("should return `path` config value in favour of `defaultValue` if exists", function() {
        expect(config.get("database.default", "mysql")).to.equal("sqlite");
      });

      it("should return `defaultValue` if no config exists for given `path`", function() {
        expect(config.get("host", "system")).to.equal("system");
      });
    });
  },

  set() {
    describe(".set(path, value)", function configDotSet_Spec() {
      it("should set new top-level config key if not exists", function() {
        expect(config.get("host")).to.equal(undefined);

        config.set("host", "system");

        expect(config.get("host")).to.equal("system");
      });

      it("should set nested config key if not exists", function() {
        expect(config.get("event")).to.equal(undefined);
        expect(config.get("event.actor")).to.equal(undefined);

        config.set("event.actor", "user");

        expect(config.get("event")).to.be.an("object");
        expect(config.get("event")).to.have.property("actor");
        expect(config.get("event.actor")).to.equal("user");
      });
    });
  },

  reset() {
    describe(".reset([path])", function configDotReset_Spec() {
      it("should reset entire config object if no `path` specified", function() {
        expect(config.get("app.environment")).to.equal("test");
        expect(config.get("app.timezone")).to.equal("UTC");
        expect(config.get("database")).to.deep.equal(defaultDbConfig);

        config.set("app.environment", "staging");
        config.set("app.timezone", "Africa/Lagos");
        config.set("database.default", "mysql");

        expect(config.get("app.environment")).to.equal("staging");
        expect(config.get("app.timezone")).to.equal("Africa/Lagos");
        expect(config.get("database")).to.deep.equal({
          ...defaultDbConfig, default: "mysql"
        });

        config.reset();

        expect(config.get("app.environment")).to.equal("test");
        expect(config.get("app.timezone")).to.equal("UTC");
        expect(config.get("database")).to.deep.equal(defaultDbConfig);
      });

      it("should reset only specified `path` if exists", function() {
        expect(config.get("app.environment")).to.equal("test");
        expect(config.get("app.timezone")).to.equal("UTC");
        expect(config.get("database")).to.deep.equal(defaultDbConfig);

        config.set("app.environment", "staging");
        config.set("app.timezone", "Africa/Lagos");
        config.set("database.default", "mysql");

        expect(config.get("app.environment")).to.equal("staging");
        expect(config.get("app.timezone")).to.equal("Africa/Lagos");
        expect(config.get("database")).to.deep.equal({
          ...defaultDbConfig, default: "mysql"
        });

        config.reset("app.timezone");

        expect(config.get("app.timezone")).to.equal("UTC");
        expect(config.get("app.environment")).to.equal("staging");
        expect(config.get("database")).to.deep.equal({
          ...defaultDbConfig, default: "mysql"
        });

        config.set("app.timezone", "Africa/Lagos");

        expect(config.get("app.environment")).to.equal("staging");
        expect(config.get("app.timezone")).to.equal("Africa/Lagos");

        config.reset("app");

        expect(config.get("app.environment")).to.equal("test");
        expect(config.get("app.timezone")).to.equal("UTC");
        expect(config.get("database")).to.deep.equal({
          ...defaultDbConfig, default: "mysql"
        });

        config.reset("database.default");

        expect(config.get("database")).to.deep.equal(defaultDbConfig);
      });
    });
  },
};
