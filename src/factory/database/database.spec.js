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
    orm      : "mongoose",
    exitOnConnectFail: false,
  },

  sqlite: {
    storagePath : ".sqlite",
    dbName      : "test.sqlite",
    dbEngine    : "sqlite",
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

      /*
       * We are filtering the mongodb out so that the last test can pass.
       * We are filtering the sqlite out to avoid creating a localhost/ directory.
       * However, we are leaving both of them in the supportedDbTypes
       * so that the test can pass the generated error message.
       */
      const useDbTypes = supportedDbTypes.filter(type => (
        !["mongodb", "sqlit"].includes(type)
      ));

      it("should throw if driver is not supported", async function() {
        const driverError = errorPrefix + "Invalid `driver` parameter. " +
          `Supported drivers include ${supportedDbTypes.join(", ")}`;

        const unsupportedDbTypes = ["database", "file", "graph"];
        const connObj = { host: "localhost", port: 3006, dbName: "testDb" };

        for(const driver of unsupportedDbTypes) {
          connObj.dbEngine = driver;

          await expect(DatabaseFactory.createDatastore(driver, connObj))
            .to.be.rejectedWith(TypeError, driverError);
        }

        for(const driver of useDbTypes) {
          connObj.dbEngine = driver;

          if(driver === "mongodb") {
            connObj.orm = "mongoose";
          }

          if(driver === "sqlite") {
            connObj.storagePath = config.sqlite.storagePath;
          }

          await expect(DatabaseFactory.createDatastore(driver, connObj))
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
