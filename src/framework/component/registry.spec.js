/* eslint-env node, mocha */

const { chai } = require("../lib/test-helper");
const createRegistry = require("./registry");

let expect;

before(async function() {
  expect = (await chai()).expect;
});

module.exports = {
  createRegistry() {
    describe("createRegistry()", function createRegistry_Spec() {
      it("should return a 'registry' object", function() {
        const registry = createRegistry();
        const registryMethods = ["add", "contains", "get", "remove"];

        for(const method of registryMethods) {
          expect(registry).to.have.property(method).to.be.a("function");
        }
      });
    });
  },

  add() {
    const registry = createRegistry();

    describe("registry.add(key, value)", function registryAdd_Spec() {
      it("should set new top-level key if not exists", function() {
        expect(registry.get("host")).to.equal(undefined);

        registry.add("host", "system");

        expect(registry.get("host")).to.equal("system");
      });

      it("should set nested key if not exists", function() {
        expect(registry.get("event")).to.equal(undefined);
        expect(registry.get("event.actor")).to.equal(undefined);

        registry.add("event.actor", "user");

        expect(registry.get("event")).to.be.an("object");
        expect(registry.get("event")).to.have.property("actor");
        expect(registry.get("event.actor")).to.equal("user");
      });
    });
  },

  get() {
    const registry = createRegistry();

    describe("registry.get(key[, defaultValue])", function registryGet_Spec() {
      it("should return undefined for non-existent key", function() {
        expect(registry.get("database")).to.equal(undefined);
      });

      it("should return value for `key` if exists", function() {
        expect(registry.get("database")).to.equal(undefined);

        registry.add("database", "sqlite");

        expect(registry.get("database")).to.equal("sqlite");
      });

      it("should return dot-separated key's value if exists", function() {
        registry.add("app.environment", "test");
        registry.add("app.timezone", "UTC");

        expect(registry.get("app.environment")).to.equal("test");
        expect(registry.get("app.timezone")).to.equal("UTC");
      });

      it("should return value for key in favour of `defaultValue` if exists", function() {
        registry.add("database.default", "mongodb");

        expect(registry.get("database.default", "mysql")).to.equal("mongodb");
      });

      it("should return `defaultValue` if key does not exist", function() {
        expect(registry.get("host")).to.equal(undefined);
        expect(registry.get("host", "system")).to.equal("system");
      });
    });
  },
};
