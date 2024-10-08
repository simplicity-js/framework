"use strict";

/* eslint-env node, mocha */
const { serialize, deserialize } = require("../../component/serializer");
const { chai } = require("../../lib/test-helper");
const createCache = require("./redis-cache");

const redisConnectionConfig = {
  credentials: {
    host: "127.0.0.1",
    port: 6379,
    autoConnect: true,
  },
};


module.exports = {
  set() {
    describe(".set(key, value[, { duration }])", function() {
      let expect;
      let cache;
      const users = [{ name: "jamie", email: "jamie@lanister.com" }];

      before(async function() {
        expect = (await chai()).expect;

        cache = createCache(redisConnectionConfig);
      });

      afterEach(async function() {
        await cache.clear();
      });

      after(async function() {
        await cache.client().disconnect();
      });

      it("should cache the value using the key as identifier", async function() {
        expect(await cache.get("users")).to.equal(null);

        await cache.set("users", serialize(users));

        expect(deserialize(await cache.get("users"))).to.deep.equal(users);
      });
    });
  },

  get() {
    describe(".get(key)", function() {
      let expect;
      let cache;
      const users = [{ name: "tyrion", email: "tyrion@lanister.com" }];

      before(async function() {
        expect = (await chai()).expect;

        cache = createCache(redisConnectionConfig);
      });

      afterEach(async function() {
        await cache.clear();
      });

      after(async function() {
        await cache.client().disconnect();
      });

      it("should returned undefined if key was not previously set", async function() {
        expect(await cache.get("users")).to.equal(null);
      });

      it("should return the value stored using the key", async function() {
        expect(await cache.get("users")).to.equal(null);

        await cache.set("users", serialize(users));

        expect(deserialize(await cache.get("users"))).to.deep.equal(users);
      });
    });
  },

  contains() {
    describe(".contains(key)", function() {
      let expect;
      let cache;
      const users = [{ name: "cersei", email: "cersei@lanister.com" }];

      before(async function() {
        expect = (await chai()).expect;

        cache = createCache(redisConnectionConfig);
      });

      afterEach(async function() {
        await cache.clear();
      });

      after(async function() {
        await cache.client().disconnect();
      });

      it("should return false if the key is not set", async function() {
        expect(await cache.contains("users")).to.equal(0);
      });

      it("should return true if the key is set", async function() {
        expect(await cache.contains("users")).to.equal(0);

        await cache.set("users", serialize(users));

        expect(await cache.contains("users")).to.equal(1);
      });
    });
  },

  unset() {
    describe(".unset(key)", function() {
      let expect;
      let cache;
      const users = [{ name: "tywin", email: "tywin@lanister.com" }];

      before(async function() {
        expect = (await chai()).expect;

        cache = createCache(redisConnectionConfig);
      });

      afterEach(async function() {
        await cache.clear();
      });

      after(async function() {
        await cache.client().disconnect();
      });

      it("should remove cached value by key", async function() {
        expect(await cache.get("users")).to.equal(null);
        expect(await cache.get("products")).to.equal(null);

        await cache.set("users", serialize(users));
        await cache.set("products", serialize([]));

        expect(deserialize(await cache.get("users"))).to.deep.equal(users);
        expect(deserialize(await cache.get("products"))).to.deep.equal([]);

        await cache.unset("users");

        expect(await cache.get("users")).to.equal(null);
        expect(deserialize(await cache.get("products"))).to.deep.equal([]);
      });
    });
  }
};
