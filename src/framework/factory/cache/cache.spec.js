"use strict";

/* eslint-env node, mocha */

const path = require("node:path");
const NodeCache = require("node-cache");
const { chai } = require("../../lib/test-helper");
const CacheFactory = require(".");;


const connections = {};
const storagePath = path.join(__dirname.replace(/\\/g, "/"), ".data");
const configs = {
  file: { storagePath },
  memory: { store: new NodeCache() },
  redis: { credentials: {
    host: "localhost",
    port: 6379,
    autoConnect: false,
  }},
};


module.exports = {
  createCache() {
    describe("CacheFactory.createCache(driver, config)", function() {
      let expect;

      before(async function() {
        expect = (await chai()).expect;
      });

      const supportedCacheTypes = ["file", "memory", "redis"];
      const errorPrefix = "CacheFactory::getCache(driver, config): ";

      it("should throw if driver is not supported", function() {
        const driverError = errorPrefix + "Invalid `driver` parameter. " +
          `Supported drivers include ${supportedCacheTypes.join(", ")}`;

        function thrower() {
          CacheFactory.createCache("database", {});
        }

        expect(thrower).to.throw(driverError);
      });

      it("should throw if config is not an object", function() {
        const configError = errorPrefix + "The `config` parameter expects an object.";

        function thrower() {
          CacheFactory.createCache("file", undefined);
        }

        expect(thrower).to.throw(configError);
      });

      it("should throw if the right config is not passed for specified driver", function() {
        const expectedStoreMethods = ["get", "set", "has", "keys", "del"];
        const expectedProps = [
          "connection",
          "credentials{ url | (host, port, username, password, db) }"
        ];

        expect(function thrower() {
          CacheFactory.createCache("file", configs.memory);
        }).to.throw(
          errorPrefix +
          "The `config` parameter for the 'file' driver expects an object with a " +
          "`storagePath` string property."
        );

        expect(function thrower() {
          CacheFactory.createCache("memory", configs.redis);
        }).to.throw(
          errorPrefix +
          "The `config` parameter for the 'memory' driver expects an object with a " +
          `\`store\` object property having methods: ${expectedStoreMethods.join(", ")}.`
        );

        expect(function thrower() {
          CacheFactory.createCache("redis", configs.file);
        }).to.throw(
          errorPrefix +
          "The `config` parameter for the 'redis' driver expects an object with " +
          `one of either properties: ${expectedProps.join(", ")}.`
        );
      });

      it("should create the cache using the appropriate driver", function() {
        for(const driver of ["file", "memory", "redis"]) {
          const cache = CacheFactory.createCache(driver, configs[driver]);

          connections[driver] = cache;

          expect(cache).to.be.an("object");
          expect(cache).to.have.property("driver", driver);

          for(const method of ["set", "get", "contains", "unset", "client"]) {
            expect(cache).to.have.property(method).to.be.a("function");
          }
        }
      });
    });
  }
};
