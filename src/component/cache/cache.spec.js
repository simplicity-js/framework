"use strict";

/* eslint-env node, mocha */

const { chai } = require("../../lib/test-helper");
const getCache = require(".");


module.exports = {
  cache() {
    describe("component.cache(driver, config)", function() {
      let expect;

      before(async function() {
        expect = (await chai()).expect;
      });

      const drivers = ["file", "memory", "redis"];
      const config = {
        get(str) {
          if(str === "redis") {
            return {
              host: "localhost",
              port: 6379,
              autoConnect: false,
            };
          }
        }
      };

      drivers.forEach(driver => {
        it(`should create a ${driver}-based cache if driver is '${driver}'`, function() {
          const cache = getCache(driver, config);

          expect(cache).to.be.an("object");
          expect(cache).to.have.property("driver", driver);

          for(const method of ["set", "get", "contains", "unset", "client"]) {
            expect(cache).to.have.property(method).to.be.a("function");
          }
        });
      });
    });
  }
};
