"use strict";

const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");
const { MIGRATION_TYPES, TEMPLATES_DIR } = require("../src/helpers/constants");
const { createDirectory, deleteFileOrDirectory, pathExists } = require(
  "../src/helpers/file-system");
const {
  makeController, makeMigration, makeModel, makeRoute, migrate,
  setAdditionalOrms, clearAdditionalOrms, getDatabaseConnection
} = require("../src");
const createAssertions = require("./test-helpers/assertions-helper");
const { chai, dropCollections, spyOnConsoleOutput,
  normalizeMongooseMigrationFilesForTesting
} = require("./test-helpers/test-helper");

let httpPath;
let controllersPath;
let migrationsPath;
let modelsPath;
let routesPath;

let assertControllerFile;
let assertMigrationFile;
let assertModelFile;
let assertStandaloneRouteFile;
let clearInlineRoute;
let collectionExists;
let tableExists;
let verifyInlineRouteExists;
let normalizePath;

const currDir = __dirname.replace(/\\/g, "/");
const testApp = `${currDir}/test-app`;

const ormApi = {
  createMigration: () => {},
  migrate: () => {},
  rollback: () => {},
  parseModelFields: () => {},
  getDatabaseConnection: () => {},
  databases: ["eloquent"],
};

const ormApiKeys = Object.keys(ormApi);

describe("lib.js", function() {
  let expect;

  before(async function() {
    this.timeout(1000 * 5);

    expect = (await chai()).expect;

    if(process.cwd() !== testApp) {
      process.chdir(testApp);
    }

    const assertions = createAssertions({ expect, TEMPLATES_DIR });

    assertControllerFile = assertions.assertControllerFile;
    assertMigrationFile = assertions.assertMigrationFile;
    assertModelFile = assertions.assertModelFile;
    assertStandaloneRouteFile = assertions.assertStandaloneRouteFile;
    clearInlineRoute = assertions.clearInlineRoute;
    collectionExists = assertions.collectionExists;
    tableExists = assertions.tableExists;
    verifyInlineRouteExists = assertions.verifyInlineRouteExists;
    normalizePath = assertions.normalizePath;

    httpPath = path.join(process.cwd(), "src", "app", "http");
    controllersPath = path.join(httpPath, "controllers");
    migrationsPath = path.join(process.cwd(), "src", "database", "migrations");
    modelsPath = path.join(httpPath, "models");
    routesPath = path.join(process.cwd(), "src", "routes");
  });

  beforeEach(function(done) {
    if(process.cwd() !== testApp) {
      process.chdir(testApp);
    }

    done();
  });

  describe("makeController(name, options)", function testMakeController() {
    it("should fail if the 'name' argument is missing", function(done) {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      makeController();
      restore();

      const expected = /The Controller name is required./;

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(controllersPath, "undefined-controller.js")))
        .to.be.false;

      done();
    });

    it("should fail if the passed 'database' ORM API is incomplete", function(done) {
      const orm = "mysql";
      const controllerName = "orm-controller";
      const supportedOrms = ["mongoose", "sequelize"];

      for(const key of ormApiKeys) {
        const incompleteApi = { ...ormApi, name: orm };
        delete incompleteApi[key];

        setAdditionalOrms([ incompleteApi ]);

        const { sinonSpy, restore } = spyOnConsoleOutput();
        makeController(controllerName, { database: ormApi.databases[0] });
        restore();

        let expected;

        if(key === "databases") {
          expected = new RegExp(
            "Invalid value 'undefined' for option 'orm'. " +
            `Valid values are ${supportedOrms.join(" and ")}.`
          );
        } else if(key === "name") {
          expected = new RegExp(
            `Missing string '${key}' on '${orm}' for option 'orm'.`
          );
        } else {
          expected = new RegExp(
            `Missing method '${key}' on '${orm}' for option 'orm'.`
          );
        }

        expect(sinonSpy.calledOnce).to.be.true;
        expect(sinonSpy.getCall(0).args[0]).to.match(expected);
        expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
        expect(pathExists(path.join(controllersPath, `${controllerName}.js`)))
          .to.be.false;

        clearAdditionalOrms(orm);
      }

      done();
    });

    it("should fail if the `orm` directory does not exist in the templates directory", function(done) {
      const orm = "eloquent";
      const controllerName = "orm-controller";
      const { sinonSpy, restore } = spyOnConsoleOutput();

      setAdditionalOrms([{ ...ormApi, name: orm }]);

      makeController(controllerName, { database: "eloquent" });
      restore();

      const expected = new RegExp(
        `The '${orm}' directory does not exist. ` +
        `Kindly create it inside the ${TEMPLATES_DIR} directory.`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(controllersPath, `${controllerName}.js`)))
        .to.be.false;

      clearAdditionalOrms(orm);
      done();
    });

    it("should fail if the `orm` directory does not contain a controller template stub", function(done) {
      const orm = "mysql";
      const controllerName = "orm-controller";
      const { sinonSpy, restore } = spyOnConsoleOutput();

      setAdditionalOrms([{ ...ormApi, name: orm }]);

      makeController(controllerName, { database: ormApi.databases[0] });
      restore();

      const expected = new RegExp(
        "Template file 'controller.stub' not found. " +
        `No such file exists inside the ${TEMPLATES_DIR}/${orm} directory.`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(controllersPath, `${controllerName}.js`)))
        .to.be.false;

      clearAdditionalOrms(orm);
      done();
    });

    it("should fail if the controller already exists", function(done) {
      const { restore } = spyOnConsoleOutput();
      const controllerName = "test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      // Create the controller the first time
      makeController(controllerName);
      restore();

      expect(pathExists(controllerFile)).to.equal(true);
      assertControllerFile(controllerFile, {
        name: "TestController",
        model: "Test",
        entity: "test",
        orm: "sequelize",
        isResource: false,
      });

      // Create the failing controller with the same name as the first
      // Even with different ORMs but same name, it should still fail
      // because controllers are all stored inside the same parent directory.
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

      makeController(controllerName, { orm: "mongoose" });
      restore2();

      const expected = new RegExp("Controller already exists.");

      expect(sinonSpy2.calledOnce).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

      deleteFileOrDirectory(controllerFile);
      done();
    });

    it("should create a controller file in src/app/http/controllers directory", function(done) {
      const { restore } = spyOnConsoleOutput();
      const controllerName = "test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      makeController(controllerName);
      restore();

      expect(pathExists(controllerFile)).to.equal(true);
      assertControllerFile(controllerFile, {
        name: "TestController",
        model: "Test",
        entity: "test",
        orm: "sequelize",
        isResource: false,
      });

      deleteFileOrDirectory(controllerFile);
      done();
    });

    it("should normalize controller names to their kebab-case versions", function(done) {
      let counter = 0;
      const normalizedName = "UserController";
      const controllerNames = [
        "user",
        "User",
        "user-controller",
        "user_controller",
        "userController",
        "user-Controller",
        "user_Controller",
        "user controller",
        "UserController",
        "User-Controller",
        "User_Controller",
        "User Controller"
      ];

      for(const controllerName of controllerNames) {
        const database = ((counter % 2) ? "sqlite" : "mongodb");
        const { restore } = spyOnConsoleOutput();
        const expectedOutputFile = path.join(controllersPath, "user-controller.js");

        expect(pathExists(expectedOutputFile)).to.be.false;

        makeController(controllerName, { database });
        restore();

        expect(pathExists(expectedOutputFile)).to.equal(true);
        assertControllerFile(expectedOutputFile, {
          name: normalizedName,
          model: "User",
          entity: "user",
          orm: database === "sqlite" ? "sequelize" : "mongoose",
          isResource: false,
        });
        deleteFileOrDirectory(expectedOutputFile);
        ++counter;
      }

      done();
    });
  });

  describe("makeMigration(name, options)", function testMakeMigration() {
    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      const destination = await makeMigration();
      restore();

      const expected = /The Migration name is required./;

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(destination || "")).to.be.false;
    });

    it("should fail if the passed 'database' ORM API is incomplete", async function() {
      const orm = "mysql";
      const migrationName = "create-users-table";
      const supportedOrms = ["mongoose", "sequelize"];

      for(const key of ormApiKeys) {
        const incompleteApi = { ...ormApi, name: orm };
        delete incompleteApi[key];

        setAdditionalOrms([ incompleteApi ]);

        const { sinonSpy, restore } = spyOnConsoleOutput();
        const destination = await makeMigration(migrationName, {
          database: ormApi.databases[0],
        });
        restore();

        let expected;

        if(key === "databases") {
          expected = new RegExp(
            "Invalid value 'undefined' for option 'orm'. " +
            `Valid values are ${supportedOrms.join(" and ")}.`
          );
        } else {
          expected = new RegExp(
            `Missing method '${key}' on '${orm}' for option 'orm'.`
          );
        }

        expect(sinonSpy.calledOnce).to.be.true;
        expect(sinonSpy.getCall(0).args[0]).to.match(expected);
        expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
        expect(pathExists(destination || "")).to.be.false;

        clearAdditionalOrms(orm);
      }
    });

    it("should fail if an invalid 'type' option is passed", async function() {
      const database = "mongodb";
      const type = "split-table";
      const migrationName = "split-users-table";
      const { sinonSpy, restore } = spyOnConsoleOutput();

      const destination = await makeMigration(migrationName, { database, type });
      restore();

      const expected = new RegExp(
        `Invalid migration type '${type}' specified. ` +
        `Valid migration types include ${MIGRATION_TYPES.join(", ")}.`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(destination || "")).to.be.false;
    });

    it("should fail if a migration with the same name already exists for given ORM", async function() {
      const orm = "sequelize";
      const { restore } = spyOnConsoleOutput();
      const migrationName = "delete-user-email-field";
      const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

      expect(pathExists(migrationFile)).to.be.false;

      // Create the migration the first time
      const destination = await makeMigration(migrationName);
      restore();

      expect(pathExists(destination)).to.equal(true);
      assertMigrationFile(destination, {
        name: migrationName,
        type: "generic",
        model: "",
        modelFilename: "",
        table: "",
        orm: orm,
      });

      // Create the failing migration with same name as the first
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();
      await makeMigration(migrationName);
      restore2();

      const expected = new RegExp("Migration already exists.");

      expect(sinonSpy2.calledOnce).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

      deleteFileOrDirectory(destination);
    });

    it("should create a migration file in src/databases/migrations/<ORM> directory", async function() {
      const orm = "sequelize";
      const { restore } = spyOnConsoleOutput();
      const migrationName = "delete-user-name-field";
      const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

      expect(pathExists(migrationFile)).to.be.false;

      const destination = await makeMigration(migrationName);
      restore();

      expect(pathExists(destination)).to.equal(true);
      assertMigrationFile(destination, {
        name: migrationName,
        type: "generic",
        model: "",
        modelFilename: "",
        table: "",
        orm: orm,
      });

      deleteFileOrDirectory(destination);
    });

    it("should normalize migration names to their kebab-case versions", async function() {
      const normalizedName = "scan-users-table";
      const migrationNames = [
        "scan-users-table",
        "ScanUsersTable",
        "scan_users_table",
        "scan users table",
        "Scan Users Table",
        "Scan_Users_Table",
      ];

      for(const migrationName of migrationNames) {
        const orm = "sequelize";
        const { restore } = spyOnConsoleOutput();
        const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

        expect(pathExists(migrationFile)).to.be.false;

        const destination = await makeMigration(migrationName);
        restore();

        expect(pathExists(destination)).to.equal(true);
        assertMigrationFile(destination, {
          name: normalizedName,
          type: "generic",
          model: "",
          modelFilename: "",
          table: "",
          orm: orm,
        });

        deleteFileOrDirectory(destination);
      }
    });

    it("should reasonably guess the migration type from the migration name", async function() {
      this.timeout(5000);

      const databases = ["mongodb", "sqlite"];
      const migrationNames = [
        "alter-users-table",
        "create-users-table",
        "update-users-table",
      ];

      for(const migrationName of migrationNames) {
        for(const database of databases) {
          const orm = database === "mongodb" ? "mongoose" : "sequelize";
          const { restore } = spyOnConsoleOutput();
          const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

          expect(pathExists(migrationFile)).to.be.false;

          const destination = await makeMigration(migrationName, { database });
          restore();

          expect(pathExists(destination)).to.equal(true);
          assertMigrationFile(destination, {
            fields: "",
            name: migrationName,
            type: migrationName.replace("users-", ""),
            model: "User",
            modelFilename: "user",
            table: "users",
            orm: orm,
          });

          deleteFileOrDirectory(destination);
        }
      }
    });
  });

  describe("makeModel(name, options)", function() {
    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await makeModel();
      restore();

      const expected = /The Model name is required./;

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(modelsPath, "Undefined.js")))
        .to.be.false;
    });

    it("should fail if the passed 'database' ORM API is incomplete", async function() {
      const orm = "mysql";
      const modelName = "Orm";
      const supportedOrms = ["mongoose", "sequelize"];

      for(const key of ormApiKeys) {
        const incompleteApi = { ...ormApi, name: orm };
        delete incompleteApi[key];

        setAdditionalOrms([ incompleteApi ]);

        const { sinonSpy, restore } = spyOnConsoleOutput();

        await makeModel(modelName, { database: ormApi.databases[0] });
        restore();

        let expected;

        if(key === "databases") {
          expected = new RegExp(
            "Invalid value 'undefined' for option 'orm'. " +
            `Valid values are ${supportedOrms.join(" and ")}.`
          );
        } else {
          expected = new RegExp(
            `Missing method '${key}' on '${orm}' for option 'orm'.`
          );
        }

        expect(sinonSpy.calledOnce).to.be.true;
        expect(sinonSpy.getCall(0).args[0]).to.match(expected);
        expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
        expect(pathExists(path.join(modelsPath, `${modelName.toLowerCase()}.js`)))
          .to.be.false;

        clearAdditionalOrms(orm);
      }
    });

    it("should fail if the `orm` directory does not exist in the templates directory", async function() {
      const orm = "eloquent";
      const modelName = "Eloquent";
      const { sinonSpy, restore } = spyOnConsoleOutput();

      setAdditionalOrms([{ ...ormApi, name: orm }]);

      await makeModel(modelName, { database: ormApi.databases[0] });
      restore();

      const expected = new RegExp(
        `The '${orm}' directory does not exist. ` +
        `Kindly create it inside the ${TEMPLATES_DIR} directory.`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(modelsPath, `${modelName.toLowerCase()}.js`)))
        .to.be.false;

      clearAdditionalOrms(orm);
    });

    it("should fail if the `orm` directory does contain a model template stub", async function() {
      const orm = "mysql";
      const modelName = "Mysql";
      const { sinonSpy, restore } = spyOnConsoleOutput();

      setAdditionalOrms([{ ...ormApi, name: orm }]);

      await makeModel(modelName, { database: ormApi.databases[0] });
      restore();

      const expected = new RegExp(
        "Template file 'model.stub' not found. " +
        `No such file exists inside the ${TEMPLATES_DIR}/${orm} directory.`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(modelsPath, `${modelName.toLowerCase()}.js`)))
        .to.be.false;

      clearAdditionalOrms(orm);
    });

    it("should fail if the model already exists", async function() {
      const orm = "sequelize";
      const database = "sqlite";
      const { restore } = spyOnConsoleOutput();
      const modelName = "OverwriteFalse";
      const filename = "overwrite-false.js";
      const modelFile = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile)).to.be.false;

      // Create the model the first time
      await makeModel(modelName, { database });
      restore();

      expect(pathExists(modelFile)).to.equal(true);
      assertModelFile(modelFile, {
        name: modelName,
        table: "overwrite_falses",
        orm: orm,
        connection: database,
        fields: "",
      });

      // Create the failing model with the same name and same ORM as the first
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

      await makeModel(modelName, { orm });
      restore2();

      const expected = new RegExp("Model already exists.");

      expect(sinonSpy2.calledOnce).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

      deleteFileOrDirectory(modelFile);
    });

    it("should accommodate same-named models with different ORMs", async function() {
      let orm = "sequelize";
      const database = "sqlite";
      const { restore } = spyOnConsoleOutput();
      const modelName = "SameName";
      const filename = "same-name.js";
      const tableName = "same_names";
      const modelFile1 = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile1)).to.be.false;

      // Create the first model with "sequelize" as the ORM
      // It will be stored in the app/http/models/sequelize directory.
      await makeModel(modelName, { database });
      restore();

      expect(pathExists(modelFile1)).to.equal(true);
      assertModelFile(modelFile1, {
        name: modelName,
        table: tableName,
        orm: orm,
        connection: database,
        fields: "",
      });

      // Create the second model with "mongoose" as the ORM.
      // It will be stored in the app/http/models/sequelize directory.
      // So, there won't be any conflict with the first, sequelize-based, model.
      orm = "mongoose";
      const { restore: restore2 } = spyOnConsoleOutput();
      const modelFile2 = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile2)).to.be.false;

      await makeModel(modelName, { database: "mongodb" });
      restore2();

      expect(pathExists(modelFile2)).to.equal(true);
      assertModelFile(modelFile2, {
        name: modelName,
        table: tableName,
        orm: orm,
        fields: "",
      });

      deleteFileOrDirectory(modelFile1);
      deleteFileOrDirectory(modelFile2);
    });

    it("should create a model file in src/app/http/models directory", async function() {
      const orm = "sequelize";
      const { restore } = spyOnConsoleOutput();
      const modelName = "Test";
      const modelFile = path.join(modelsPath, orm, `${modelName.toLowerCase()}.js`);

      expect(pathExists(modelFile)).to.be.false;

      await makeModel(modelName);
      restore();

      expect(pathExists(modelFile)).to.equal(true);
      assertModelFile(modelFile, {
        name: "Test",
        table: "tests",
        orm: orm,
        connection: "default",
        fields: "",
      });

      deleteFileOrDirectory(modelFile);
    });

    it("should normalize model names to their UCFirst CamelCase versions", async function() {
      let counter = 0;
      const normalizedName = "CorporateUser";
      const modelNames = [
        "corporate-user",
        "corporateUser",
        "corporate-user",
        "corporate_user",
        "Corporate-user",
        "Corporate_user",
        "Corporate user",
        "Corporate users",
        "CorporateUser",
        "Corporate-User",
        "Corporate-Users",
        "Corporate_User",
        "Corporate_Users",
        "Corporate User",
        "Corporate Users",
        "CorporateUserModel",
        "Corporate User Model",
        "Corporate-user-model",
        "Corporate_user_model",
        "corporate_user-model",
      ];

      for(const modelName of modelNames) {
        const database = ((counter % 2) ? "sqlite" : "mongodb");
        const orm = database === "sqlite" ? "sequelize" : "mongoose";
        const { restore } = spyOnConsoleOutput();
        const expectedOutputFile = path.join(modelsPath, orm, "corporate-user.js");

        expect(pathExists(expectedOutputFile)).to.be.false;

        await makeModel(modelName, { database });
        restore();

        expect(pathExists(expectedOutputFile)).to.equal(true);
        assertModelFile(expectedOutputFile, {
          name: normalizedName,
          table: "corporate_users",
          orm: orm,
          connection: database,
          fields: "",
        });
        deleteFileOrDirectory(expectedOutputFile);
        counter++;
      }
    });
  });

  describe("makeRoute(name, options)", function() {
    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await makeRoute();
      restore();

      const expected = /The Route name is required./;

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
    });

    it("should create regular web routes by default", async function() {
      const routeName = "lib-posts";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "LibPostController";
      const controllerFile = "lib-post-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.false;

      const { restore } = spyOnConsoleOutput();
      const output = await makeRoute(routeName);
      restore();

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.true;

      clearInlineRoute(routeFile, controllerName, controllerFile, output);
    });

    it("should create API routes if the 'isApiRoute' option is true", async function() {
      const routeName = "lib-api-posts";
      const routeFile = path.join(routesPath, "api.js");
      const controllerName = "LibApiPostController";
      const controllerFile = "lib-api-post-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.false;

      const { restore } = spyOnConsoleOutput();
      const output = await makeRoute(routeName, { isApiRoute: true });
      restore();

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.true;

      clearInlineRoute(routeFile, controllerName, controllerFile, output);
    });

    it("should create resource routes if the 'isResourceRoute' option is true", async function() {
      const routeName = "lib-users";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "LibUserController";
      const controllerFile = "lib-user-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.false;

      const { restore } = spyOnConsoleOutput();
      const output = await makeRoute(routeName, { isResourceRoute: true });
      restore();

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.true;

      clearInlineRoute(routeFile, controllerName, controllerFile, output);
    });

    it("should always create resource routes as web routes", async function() {
      const routeName = "lib-comments";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "LibCommentController";
      const controllerFile = "lib-comment-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.false;

      const { restore } = spyOnConsoleOutput();
      const output = await makeRoute(routeName, {
        isApiRoute: true,
        isResourceRoute: true,
      });
      restore();

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.true;

      clearInlineRoute(routeFile, controllerName, controllerFile, output);
    });

    describe("web and api folders", function() {
      before(function(done) {
        createDirectory(`${routesPath}/web`);
        createDirectory(`${routesPath}/api`);
        done();
      });

      after(function(done) {
        this.timeout(5000);

        deleteFileOrDirectory(`${routesPath}/web`);
        deleteFileOrDirectory(`${routesPath}/api`);
        done();
      });

      it("should take precedence over the 'web.js' file when creating web routes", async function() {
        const routeName = "lib-customers";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "LibCustomerController";
        const controllerFile = "lib-customer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { restore } = spyOnConsoleOutput();
        const destination = await makeRoute(routeName);
        restore();


        // Assert that the route was created inside the 'web' folder.
        expect(pathExists(routeFile)).to.equal(true);
        expect(normalizePath(routeFile)).to.equal(normalizePath(destination));
        assertStandaloneRouteFile(routeFile, {
          name: routeName,
          controllerName: controllerName,
          controllerFilename: controllerFile,
          isResourceRoute: false,
        });

        // Assert that the route was not created inside the 'web.js' file.
        expect(verifyInlineRouteExists(routeFile, {
          route: routeName,
          controller: controllerName,
          controllerFile: controllerFile,
          isResourceRoute: false,
        })).to.be.false;

        deleteFileOrDirectory(routeFile);
      });

      it("should take precedence over the 'api.js' file when creating API routes", async function() {
        const routeName = "lib-api-customers";
        const routeDirectory = path.join(routesPath, "api");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "LibApiCustomerController";
        const controllerFile = "lib-api-customer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { restore } = spyOnConsoleOutput();
        const destination = await makeRoute(routeName, { isApiRoute: true });
        restore();

        // Assert that the route was created inside the 'web' folder.
        expect(pathExists(routeFile)).to.equal(true);
        expect(normalizePath(routeFile)).to.equal(normalizePath(destination));
        assertStandaloneRouteFile(routeFile, {
          name: routeName,
          controllerName: controllerName,
          controllerFilename: controllerFile,
          isResourceRoute: false,
        });

        // Assert that the route was not created inside the 'web.js' file.
        expect(verifyInlineRouteExists(routeFile, {
          route: routeName,
          controller: controllerName,
          controllerFile: controllerFile,
          isResourceRoute: false,
        })).to.be.false;

        deleteFileOrDirectory(routeFile);
      });

      it("should take precedence over the 'web.js' file when creating resource routes", async function() {
        const routeName = "lib-members";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "LibMemberController";
        const controllerFile = "lib-member-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { restore } = spyOnConsoleOutput();
        const destination = await makeRoute(routeName, {
          isApiRoute: true,
          isResourceRoute: true
        });
        restore();

        // Assert that the route was created inside the 'web' folder.
        expect(pathExists(routeFile)).to.equal(true);
        expect(normalizePath(routeFile)).to.equal(normalizePath(destination));
        assertStandaloneRouteFile(routeFile, {
          name: routeName,
          controllerName: controllerName,
          controllerFilename: controllerFile,
          isResourceRoute: true,
        });

        // Assert that the route was not created inside the 'web.js' file.
        expect(verifyInlineRouteExists(routeFile, {
          route: routeName,
          controller: controllerName,
          controllerFile: controllerFile,
          isResourceRoute: true,
        })).to.be.false;

        deleteFileOrDirectory(routeFile);
      });

      it("should fail if the route already exists", async function() {
        const routeName = "lib-tenants";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "LibTenantController";
        const controllerFile = "lib-tenant-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { restore } = spyOnConsoleOutput();
        const destination = await makeRoute(routeName);
        restore();

        // Assert that the route was created inside the 'web' folder.
        expect(pathExists(routeFile)).to.equal(true);
        expect(normalizePath(routeFile)).to.equal(normalizePath(destination));
        assertStandaloneRouteFile(routeFile, {
          name: routeName,
          controllerName: controllerName,
          controllerFilename: controllerFile,
          isResourceRoute: false,
        });

        // Assert that the route was not created inside the 'web.js' file.
        expect(verifyInlineRouteExists(routeFile, {
          route: routeName,
          controller: controllerName,
          controllerFile: controllerFile,
          isResourceRoute: false,
        })).to.be.false;

        // Create the failing route with the same name as the first
        const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

        await makeRoute(routeName);
        restore2();

        const expected = new RegExp("Route already exists.");

        expect(sinonSpy2.calledOnce).to.be.true;
        expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
        expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

        deleteFileOrDirectory(routeFile);
      });
    });
  });

  describe("migrate(options)", function() {
    this.timeout(1000 * 30);

    before(async function() {
      try {
        [this.mongooseConnection, this.sequelizeConnection] = await Promise.all([
          getDatabaseConnection("mongodb"),
          getDatabaseConnection("sqlite")
        ]);
      } catch(err) {
        fs.appendFileSync(
          `${currDir}/.logs/console.error`,
          util.inspect(err, { depth: 12 })
        );
      }

      await dropCollections(this.mongooseConnection);
      /*await this.mongooseConnection.db.collection("migrations").deleteMany({
        //name: { $regex: "(alter|create|update)-users-table" },
      });*/
    });

    after(async function() {
      try {
        await Promise.all([
          this.mongooseConnection.dropCollection("migrations"),
          this.sequelizeConnection.query("DROP TABLE IF EXISTS `SequelizeMeta`"),
        ]);

        await dropCollections(this.mongooseConnection);
        await this.sequelizeConnection.close();
      } catch(err) {
        fs.appendFileSync(
          `${currDir}/.logs/console.error`,
          util.inspect(err, { depth: 12 })
        );
      }
    });

    it("should run the migrations for 'database' option 'mongodb'", async function() {
      const database = "mongodb";
      const migrationName = "create-animals-table";
      const modelName = "Animal";
      const collection = "animals";
      const connection = this.mongooseConnection;
      const { restore } = spyOnConsoleOutput();

      expect(await collectionExists(collection, connection)).to.be.false;

      const [modelFile, migrationFile] = await Promise.all([
        makeModel(modelName, { database }),
        makeMigration(migrationName, { database })
      ]);

      await normalizeMongooseMigrationFilesForTesting(testApp, modelName);
      await migrate({ database });
      restore();

      expect(await collectionExists(collection, connection)).to.be.true;

      deleteFileOrDirectory(modelFile);
      deleteFileOrDirectory(migrationFile);

      await connection.dropCollection(collection);
    });

    it("should run the migrations for non-mongodb 'database' option", async function() {
      const database = "sqlite";
      const migrationName = "create-pets-table";
      const modelName = "Pet";
      const connection = this.sequelizeConnection;
      const table = "pets";
      const { restore } = spyOnConsoleOutput();

      expect(await tableExists(table, connection)).to.be.false;

      const [modelFile, migrationFile] = await Promise.all([
        makeModel(modelName, { database }),
        makeMigration(migrationName, { database })
      ]);

      await migrate({ database });

      restore();

      expect(await tableExists(table, connection)).to.be.true;

      deleteFileOrDirectory(modelFile);
      deleteFileOrDirectory(migrationFile);

      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    });

    it("should run the migrations for the 'default' database option", async function() {
      const database = "default";
      const migrationName = "create-gorillas-table";
      const modelName = "Gorilla";
      const connection = this.sequelizeConnection;
      const table = "gorillas";
      const { restore } = spyOnConsoleOutput();

      expect(await tableExists(table, connection)).to.be.false;

      const [modelFile, migrationFile] = await Promise.all([
        makeModel(modelName, { database}),
        makeMigration(migrationName, { database })
      ]);

      await migrate({ database });

      restore();

      expect(await tableExists(table, connection)).to.be.true;

      deleteFileOrDirectory(modelFile);
      deleteFileOrDirectory(migrationFile);

      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    });

    it("should run all migrations if the 'database' option is not specified", async function() {
      const mongooseMigrationName = "create-dogs-table";
      const mongooseModelName = "Dog";
      const mongooseConn = this.mongooseConnection;
      const collection = "dogs";

      const sequelizeMigrationName = "create-cats-table";
      const sequelizeModelName = "Cat";
      const sequelizeConn = this.sequelizeConnection;
      const table = "cats";

      const { restore } = spyOnConsoleOutput();

      expect(await collectionExists(collection, mongooseConn)).to.be.false;
      expect(await tableExists(table, sequelizeConn)).to.be.false;


      const [
        mongooseModelFile, mongooseMigrationFile,
        sequelizeModelFile, sequelizeMigrationFile
      ] = await Promise.all([
        makeModel(mongooseModelName, { database: "mongodb" }),
        makeMigration(mongooseMigrationName, { database: "mongodb" }),
        makeModel(sequelizeModelName, { database: "sqlite" }),
        makeMigration(sequelizeMigrationName, { database: "sqlite" })
      ]);

      await normalizeMongooseMigrationFilesForTesting(testApp, mongooseModelName);
      await migrate();
      restore();

      expect(await collectionExists(collection, mongooseConn)).to.be.true;
      expect(await tableExists(table, sequelizeConn)).to.be.true;

      deleteFileOrDirectory(mongooseModelFile);
      deleteFileOrDirectory(mongooseMigrationFile);
      deleteFileOrDirectory(sequelizeModelFile);
      deleteFileOrDirectory(sequelizeMigrationFile);

      await Promise.all([
        mongooseConn.dropCollection(collection),
        sequelizeConn.query(`DROP TABLE IF EXISTS \`${table}\``)
      ]);
    });
  });
});
