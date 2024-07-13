"use strict";

/* eslint-env node, mocha */

const path = require("node:path");
const { deleteDirectory, pathExists } = require("../../component/file-system");
const { chai } = require("../../lib/test-helper");
const createCache = require("./file-cache");

const storageBasePath = path.join(__dirname.replace(/\\/g, "/"), ".data");
const users = [{ name: "jamie", email: "jamie@lanister.com" }];


module.exports = {
  set() {
    describe(".set(key, value[, { duration }])", function() {
      let expect;
      let cache;
      const storagePath = `${storageBasePath}/set`;

      before(async function() {
        expect = (await chai()).expect;
        deleteDirectory(storagePath);
      });

      beforeEach(function(done) {
        cache = createCache({ storagePath });
        done();
      });

      afterEach(function(done) {
        deleteDirectory(storagePath);
        done();
      });

      it("should create the storage directory if not exists", async function() {
        expect(pathExists(storagePath)).to.equal(false);

        await cache.set("users", []);

        expect(pathExists(storagePath)).to.equal(true);
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
      const storagePath = `${storageBasePath}/get`;

      before(async function() {
        expect = (await chai()).expect;
        deleteDirectory(storagePath);
      });

      beforeEach(function(done) {
        cache = createCache({ storagePath });
        done();
      });

      afterEach(function(done) {
        deleteDirectory(storagePath);
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
      const storagePath = `${storageBasePath}/contains`;

      before(async function() {
        expect = (await chai()).expect;
        deleteDirectory(storagePath);
      });

      beforeEach(function(done) {
        cache = createCache({ storagePath });
        done();
      });

      afterEach(function(done) {
        deleteDirectory(storagePath);
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
      const storagePath = `${storageBasePath}/unset`;

      before(async function() {
        expect = (await chai()).expect;
        deleteDirectory(storagePath);
      });

      beforeEach(function(done) {
        cache = createCache({ storagePath });
        done();
      });

      afterEach(function(done) {
        deleteDirectory(storagePath);
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
