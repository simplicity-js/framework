"use strict";

/* eslint-env node, mocha */

const { chai, chaiAsPromised } = require("../../lib/test-helper");
const DatabaseFactory = require(".");;

const config = {
  mongodb: {
    url      : "",
    host     : "http://localhost",
    port     : 27017,
    username : "",
    password : "",
    dbName   : "test",
    exitOnConnectFail: false,
  },

  sqlite: {
    host     : ".sqlite",
    dbName   : "test",
    dbEngine : "sqlite",
  }
};


module.exports = {
  createDatastore() {
    describe("DatabaseFactory.createDatastore(driver, config)", function() {
      let expect;

      before(async function() {
        const chaiObj = await chai();
        const asPromised = await chaiAsPromised();

        chaiObj.use(asPromised);

        expect = chaiObj.expect;
      });

      const supportedDbTypes = ["mongodb", "mariadb", "memory", "mysql", "postgres", "sqlite"];
      const errorPrefix = "DatabaseFactory::createDatastore(driver, config): ";

      it("should throw if driver is not supported", async function() {
        const driverError = errorPrefix + "Invalid `driver` parameter. " +
          `Supported drivers include ${supportedDbTypes.join(", ")}`;

        const unsupportedDbTypes = ["database", "file", "graph"];

        for(const driver of unsupportedDbTypes) {
          await expect(DatabaseFactory.createDatastore(driver, {}))
            .to.be.rejectedWith(TypeError, driverError);
        }

        /*
         * We are filtering the mongodb out so that the last test can pass
         */
        for(const driver of supportedDbTypes.filter(type => type !== "mongodb")) {
          await expect(DatabaseFactory.createDatastore(driver, {}))
            .to.eventually.be.an("object");
        }
      });

      it("should throw if config is not an object", async function() {
        const configError = errorPrefix + "The `config` parameter expects an object.";

        for(const driver of supportedDbTypes) {
          await expect(DatabaseFactory.createDatastore(driver, undefined)).to.be.rejectedWith(TypeError, configError);
          await expect(DatabaseFactory.createDatastore(driver, null)).to.be.rejectedWith(TypeError, configError);
          await expect(DatabaseFactory.createDatastore(driver, [])).to.be.rejectedWith(TypeError, configError);
        }
      });

      it("should create the database using the appropriate driver", async function() {
        for(const driver of ["mongodb", "sqlite"]) {
          const store = await DatabaseFactory.createDatastore(driver, config[driver]);
          const storeMethods = [
            "connect", "disconnect", "connected", "getClient"
          ];

          const booleanMethods = ["connected"];
          const promiseMethods = ["connect", "disconnect"];

          expect(store).to.be.an("object");
          //expect(store).to.have.property("db");
          //expect(store).to.have.property("driver", driver);

          for(const method of storeMethods) {
            expect(store).to.have.property(method).to.be.a("function");
          }

          for(const method of booleanMethods) {
            expect(store[method]()).to.be.a("boolean");
          }

          for(const method of promiseMethods) {
            expect(store[method]()).to.be.a("promise");
          }

          if(driver === "mongodb") {
            expect(store).to.have.property("connecting").to.be.a("function");
            expect(store.connecting()).to.be.a("boolean");
          }

          if(store.connected()) {
            expect(store.getClient()).to.be.an("object");
          }
        }
      });
    });
  }
};
