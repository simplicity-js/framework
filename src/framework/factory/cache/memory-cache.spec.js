"use strict";

/* eslint-env node, mocha */
const NodeCache = require("node-cache");
const { chai } = require("../../lib/test-helper");
const createCache = require("./memory-cache");

const users = [{ name: "jamie", email: "jamie@lanister.com" }];

module.exports = {
  set() {
    describe(".set(key, value[, { duration }])", function() {
      let expect;
      let cache;

      before(async function() {
        expect = (await chai()).expect;
      });

      beforeEach(function(done) {
        cache = createCache({ store: new NodeCache() });
        done();
      });

      afterEach(function(done) {
        cache.clear();
        done();
      });

      it("should cache the value using the key as identifier", async function() {
        expect(await cache.get("users")).to.equal(undefined);

        await cache.set("users", users);

        expect(await cache.get("users")).to.deep.equal(users);
      });
    });
  },

  get() {
    describe(".get(key)", function() {
      let expect;
      let cache;

      before(async function() {
        expect = (await chai()).expect;
      });

      beforeEach(function(done) {
        cache = createCache({ store: new NodeCache() });
        done();
      });

      afterEach(function(done) {
        cache.clear();
        done();
      });

      it("should returned undefined if key was not previously set", async function() {
        expect(await cache.get("users")).to.equal(undefined);
      });

      it("should return the value stored using the key", async function() {
        expect(await cache.get("users")).to.equal(undefined);

        await cache.set("users", users);

        expect(await cache.get("users")).to.deep.equal(users);
      });
    });
  },

  contains() {
    describe(".contains(key)", function() {
      let expect;
      let cache;

      before(async function() {
        expect = (await chai()).expect;
      });

      beforeEach(function(done) {
        cache = createCache({ store: new NodeCache() });
        done();
      });

      afterEach(function(done) {
        cache.clear();
        done();
      });

      it("should return false if the key is not set", async function() {
        expect(await cache.contains("users")).to.equal(false);
      });

      it("should return true if the key is set", async function() {
        expect(await cache.contains("users")).to.equal(false);

        await cache.set("users", users);

        expect(await cache.contains("users")).to.equal(true);
      });
    });
  },

  unset() {
    describe(".unset(key)", function() {
      let expect;
      let cache;

      before(async function() {
        expect = (await chai()).expect;
      });

      beforeEach(function(done) {
        cache = createCache({ store: new NodeCache() });
        done();
      });

      afterEach(function(done) {
        cache.clear();
        done();
      });

      it("should remove cached value by key", async function() {
        expect(await cache.get("users")).to.equal(undefined);
        expect(await cache.get("products")).to.equal(undefined);

        await cache.set("users", users);
        await cache.set("products", []);

        expect(await cache.get("users")).to.deep.equal(users);
        expect(await cache.get("products")).to.deep.equal([]);

        await cache.unset("users");

        expect(await cache.get("users")).to.equal(undefined);
        expect(await cache.get("products")).to.deep.equal([]);
      });
    });
  }
};
