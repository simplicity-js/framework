"use strict";

const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
const util = require("node:util");
const { getDatabaseConnection } = require("../src");
const commandsApi = require("../src/commands");
const {
  BUILDER_NAME, FRAMEWORK_NAME,
  GENERATE_CONTROLLER_COMMAND, GENERATE_MIGRATION_COMMAND,
  GENERATE_MODEL_COMMAND, GENERATE_ROUTE_COMMAND,
  MANUAL_HELP, MIGRATION_TYPES,
  RUN_MIGRATION_COMMAND, TEMPLATES_DIR
} = require("../src/helpers/constants");
const { createDirectory, deleteFileOrDirectory, pathExists, readLinesFromFile
} = require("../src/helpers/file-system");
const { logger, marker } = require("../src/helpers/printer");
const createAssertions = require("./test-helpers/assertions-helper");
const { chai, dropCollections, escapeRegExp, spyOnConsoleOutput,
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
let collectionExists;
let normalizeHelpManual;
let normalizePath;
let parseMigrationPathFromSinonCall;
let tableExists;
let verifyInlineRouteExists;

const EOL = os.EOL;
const PADDING = "  ";
const currDir = __dirname.replace(/\\/g, "/");
const testApp = `${currDir}/test-app`;
const commands = commandsApi.list({ core: true });


describe("commands", function() {
  this.timeout(1000 * 120);

  let expect;

  before(async function() {
    expect = (await chai()).expect;

    if(process.cwd() !== testApp) {
      process.chdir(testApp);
    }

    const assertions = createAssertions({ expect, TEMPLATES_DIR });

    httpPath = path.join(process.cwd(), "src", "app", "http");
    controllersPath = path.join(httpPath, "controllers");
    migrationsPath = path.join(process.cwd(), "src", "database", "migrations");
    modelsPath = path.join(httpPath, "models");
    routesPath = path.join(process.cwd(), "src", "routes");

    assertControllerFile = assertions.assertControllerFile;
    assertMigrationFile = assertions.assertMigrationFile;
    assertModelFile = assertions.assertModelFile;
    assertStandaloneRouteFile = assertions.assertStandaloneRouteFile;
    collectionExists = assertions.collectionExists;
    normalizeHelpManual = assertions.normalizeHelpManual;
    normalizePath = assertions.normalizePath;
    parseMigrationPathFromSinonCall = assertions.parseMigrationPathFromSinonCall;
    tableExists = assertions.tableExists;
    verifyInlineRouteExists = assertions.verifyInlineRouteExists;
  });

  describe("help()", function() {
    before(async function() {
      let helpManual = "";

      try {
        const lines = await readLinesFromFile(MANUAL_HELP);

        for await(const line of lines) {
          helpManual += `${PADDING}${line}`;
        }
      } catch {
        helpManual += "";
      }

      this.helpManual = normalizeHelpManual(helpManual);
    });

    it("should display the help manual", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await commands.help.handler();
      restore();

      const expected = this.helpManual;
      const actual = normalizeHelpManual(sinonSpy.getCall(0).args[0]);

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);
    });
  });

  describe("version()", function() {
    before(function(done) {
      this.command = commands.version.handler;
      this.parentDir = path.dirname(__dirname);
      this.versionInfo = `${PADDING}${marker.success.text(FRAMEWORK_NAME)}${` version ${require("../package").version} (cli)`}`;
      done();
    });

    it("should display version information", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      process.chdir(this.parentDir);

      this.command();
      restore();

      const expected = this.versionInfo.trim();
      const actual = (sinonSpy.getCall(0).args[0]).trim();

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);

      process.chdir(testApp);
    });

    it(`should also display framework version if inside a ${FRAMEWORK_NAME} Application directory`, async function() {
      // We are inside the cli-test-app directory, so no need to chdir
      const { sinonSpy, restore } = spyOnConsoleOutput();

      this.command();
      restore();

      const cwd = normalizePath(process.cwd());

      let expected = this.versionInfo + `${EOL}${PADDING}Framework version ${require(`${cwd}/package`).version}`;
      let actual = sinonSpy.getCall(0).args[0];

      expected = expected.replace(/\r?\n/gm, "");
      actual = actual.replace(/\r?\n/gm, "");

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);
    });
  });

  describe(`${GENERATE_CONTROLLER_COMMAND}(name, [options])`, function() {
    before(function(done) {
      this.command = commands[GENERATE_CONTROLLER_COMMAND].handler;
      done();
    });

    it("should fail if the 'name' argument is missing", function(done) {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      this.command([], {}, logger);
      restore();

      const expected = new RegExp(
        "The Controller name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_CONTROLLER_COMMAND} --help for help`
      );

      expect(sinonSpy.called).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(controllersPath, "undefined-controller.js")))
        .to.be.false;
      done();
    });

    it("should fail if the controller already exists", function(done) {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const controllerName = "commands-test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      // Create the controller the first time
      this.command([controllerName], {}, logger);
      restore();

      const msg = escapeRegExp(
        `Controller [${normalizePath(controllerFile)}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(pathExists(controllerFile)).to.equal(true);
      assertControllerFile(controllerFile, {
        name: "CommandsTestController",
        model: "CommandsTest",
        entity: "commands_test",
        orm: "sequelize",
        isResource: false,
      });

      // Create the failing controller with the same name as the first
      // Even with different ORMs but same name, it should still fail
      // because controllers are all stored inside the same parent directory.
      // Create the failing controller with the same name as the first
      // Even with different ORMs but same name, it should still fail
      // because controllers are all stored inside the same parent directory.
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

      this.command([controllerName], { database: "mongodb" }, logger);
      restore2();

      const expected = new RegExp("Controller already exists.");

      expect(sinonSpy2.called).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

      deleteFileOrDirectory(controllerFile);
      done();
    });

    it("should create a controller file in src/app/http/controllers directory", function(done) {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const controllerName = "test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      this.command([controllerName], {}, logger);
      restore();

      const msg = escapeRegExp(
        `Controller [${normalizePath(controllerFile)}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
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
  });

  describe(`${GENERATE_MIGRATION_COMMAND}(name, [options])`, function() {
    before(function(done) {
      this.command = commands[GENERATE_MIGRATION_COMMAND].handler;
      done();
    });

    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      this.command([], {}, logger);
      restore();

      const expected = new RegExp(
        "The Migration name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_MIGRATION_COMMAND} --help for help`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(migrationsPath, "undefined-migration.js")))
        .to.be.false;
    });

    it("should fail if an invalid 'type' option is passed", async function() {
      const database = "mongodb";
      const type = "command-table";
      const migrationName = "command-peoples-table";
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await this.command([migrationName], { database, type }, logger);

      restore();

      const expected = new RegExp(
        `Invalid migration type '${type}' specified. ` +
        `Valid migration types include ${MIGRATION_TYPES.join(", ")}.`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
    });

    it("should fail if a migration with the same name already exists for given ORM", async function() {
      const orm = "sequelize";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const migrationName = "delete-command-email-field";
      const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

      expect(pathExists(migrationFile)).to.be.false;

      // Create the migration the first time
      await this.command([migrationName], {}, logger);
      restore();

      const destination = parseMigrationPathFromSinonCall(sinonSpy);
      const msg = escapeRegExp(`Migration [${destination}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(pathExists(destination)).to.equal(true);
      assertMigrationFile(destination, {
        name: migrationName,
        type: "generic",
        model: "",
        table: "",
        orm: orm,
      });

      // Create the failing migration with same name as the first
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();
      await this.command([migrationName], {}, logger);
      restore2();

      const expected = /Migration already exists./;

      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);
      deleteFileOrDirectory(destination);
    });

    it("should create a migration file in src/databases/migrations/<ORM> directory", async function() {
      const orm = "sequelize";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const migrationName = "delete-command-name-field";
      const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

      expect(pathExists(migrationFile)).to.be.false;

      await this.command([migrationName], {}, logger);
      restore();

      const destination = parseMigrationPathFromSinonCall(sinonSpy);
      const msg = escapeRegExp(`Migration [${destination}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(pathExists(destination)).to.equal(true);
      assertMigrationFile(destination, {
        name: migrationName,
        type: "generic",
        model: "",
        table: "",
        orm: orm,
      });

      deleteFileOrDirectory(destination);
    });

    it("should reasonably guess the migration type from the migration name", async function() {
      const databases = ["mongodb", "sqlite"];
      const migrationNames = [
        "alter-commands-table",
        "create-commands-table",
        "update-commands-table",
      ];

      for(const migrationName of migrationNames) {
        for(const database of databases) {
          const orm = database === "mongodb" ? "mongoose" : "sequelize";
          const { sinonSpy, restore } = spyOnConsoleOutput();
          const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

          expect(pathExists(migrationFile)).to.be.false;

          await this.command([migrationName], { database }, logger);
          restore();

          const destination = parseMigrationPathFromSinonCall(sinonSpy);
          const msg = escapeRegExp(`Migration [${destination}] created successfully.`);

          expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
          expect(pathExists(destination)).to.equal(true);
          assertMigrationFile(destination, {
            fields: "",
            name: migrationName,
            type: migrationName.replace("commands-", ""),
            model: "Command",
            modelFilename: "command",
            table: "commands",
            orm: orm,
          });

          deleteFileOrDirectory(destination);
        }
      }
    });
  });

  describe(`${RUN_MIGRATION_COMMAND}([options])`, function() {
    before(async function() {
      this.command = commands[RUN_MIGRATION_COMMAND].handler;
      this.makeMigrationCommand = commands[GENERATE_MIGRATION_COMMAND].handler;
      this.makeModelCommand = commands[GENERATE_MODEL_COMMAND].handler;

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
      this.timeout(1000 * 240);

      const database = "mongodb";
      const migrationName = "create-rats-table";
      const modelName = "Rat";
      const collection = "rats";
      const connection = this.mongooseConnection;
      const { restore } = spyOnConsoleOutput();

      expect(await collectionExists(collection, connection)).to.be.false;

      await Promise.all([
        this.makeMigrationCommand([migrationName], { database }, logger),
        this.makeModelCommand([modelName], { database }, logger)
      ]);

      await normalizeMongooseMigrationFilesForTesting(testApp, modelName);
      await this.command([], { database }, logger);
      restore();

      expect(await collectionExists(collection, connection)).to.be.true;

      await connection.dropCollection(collection);
    });

    it("should run the migrations for non-mongodb 'database' option", async function() {
      const database = "sqlite";
      const migrationName = "create-zebras-table";
      const modelName = "Zebra";
      const connection = this.sequelizeConnection;
      const table = "zebras";
      const { restore } = spyOnConsoleOutput();

      expect(await tableExists(table, connection)).to.be.false;

      await Promise.all([
        this.makeModelCommand([modelName], { database }, logger),
        this.makeMigrationCommand([migrationName], { database }, logger)
      ]);

      await this.command([], { database }, logger);

      restore();

      expect(await tableExists(table, connection)).to.be.true;

      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    });

    it("should run the migrations for the 'database' option 'default'", async function() {
      const database = "default";
      const migrationName = "create-penguins-table";
      const modelName = "Penguin";
      const connection = this.sequelizeConnection;
      const table = "penguins";
      const { restore } = spyOnConsoleOutput();

      expect(await tableExists(table, connection)).to.be.false;

      await Promise.all([
        this.makeMigrationCommand([migrationName], { database }, logger),
        this.makeModelCommand([modelName], { database }, logger)
      ]);

      await this.command([], { database }, logger);

      restore();

      expect(await tableExists(table, connection)).to.be.true;

      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    });

    it("should run all migrations if the 'database' option is not specified", async function() {
      const mongooseMigrationName = "create-ants-table";
      const mongooseModelName = "Ant";
      const mongooseConn = this.mongooseConnection;
      const collection = "ants";

      const sequelizeMigrationName = "create-antelopes-table";
      const sequelizeModelName = "Antelope";
      const sequelizeConn = this.sequelizeConnection;
      const table = "antelopes";

      const { restore } = spyOnConsoleOutput();

      expect(await collectionExists(collection, mongooseConn)).to.be.false;
      expect(await tableExists(table, sequelizeConn)).to.be.false;

      await Promise.all([
        this.makeMigrationCommand([mongooseMigrationName], {database: "mongodb" }, logger),
        this.makeModelCommand([mongooseModelName], { database: "mongodb" }, logger),
        this.makeMigrationCommand([sequelizeMigrationName], { database: "sqlite" }, logger),
        this.makeModelCommand([sequelizeModelName], { database: "sqlite" }, logger)
      ]);

      await normalizeMongooseMigrationFilesForTesting(testApp, mongooseModelName);
      await this.command([], {}, logger);
      restore();

      expect(await collectionExists(collection, mongooseConn)).to.be.true;
      expect(await tableExists(table, sequelizeConn)).to.be.true;

      await Promise.all([
        mongooseConn.dropCollection(collection),
        sequelizeConn.query(`DROP TABLE IF EXISTS \`${table}\``)
      ]);
    });
  });

  describe(`${GENERATE_MODEL_COMMAND}(name, [options])`, function() {
    before(function(done) {
      this.command = commands[GENERATE_MODEL_COMMAND].handler;
      done();
    });

    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await this.command([], {}, logger);
      restore();

      const expected = new RegExp(
        "The Model name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_MODEL_COMMAND} --help for help`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(pathExists(path.join(modelsPath, "undefined.js")))
        .to.be.false;
    });

    it("should fail if the model already exists", async function() {
      const orm = "sequelize";
      const database = "sqlite";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const modelName = "CommandFalse";
      const filename = "command-false.js";
      const modelFile = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile)).to.be.false;

      // Create the model the first time
      await this.command([modelName], { database }, logger);
      restore();

      const msg = escapeRegExp(
        `Model [${normalizePath(modelFile)}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(pathExists(modelFile)).to.equal(true);
      assertModelFile(modelFile, {
        name: modelName,
        table: "command_falses",
        orm: orm,
        connection: database,
        fields: "",
      });

      // Create the failing model with the same name and same ORM as the first
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

      await this.command([modelName], { database }, logger);
      restore2();

      const expected = new RegExp("Model already exists.");

      expect(sinonSpy2.calledOnce).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

      deleteFileOrDirectory(modelFile);
    });

    it("should accommodate same-named models with different ORMs", async function() {
      let orm = "sequelize";
      let database = "sqlite";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const modelName = "SameNameCommand";
      const filename = "same-name-command.js";
      const tableName = "same_name_commands";
      const modelFile1 = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile1)).to.be.false;

      // Create the first model with "sequelize" as the ORM
      // It will be stored in the app/http/models/sequelize directory.
      await this.command([modelName], { database }, logger);
      restore();

      let msg = escapeRegExp(
        `Model [${normalizePath(modelFile1)}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
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
      database = "mongodb";
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();
      const modelFile2 = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile2)).to.be.false;

      await this.command([modelName], { database }, logger);
      restore2();

      msg = escapeRegExp(
        `Model [${normalizePath(modelFile2)}] created successfully.`);

      expect(sinonSpy2.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(pathExists(modelFile2)).to.equal(true);
      assertModelFile(modelFile2, {
        name: modelName,
        table: tableName,
        orm: orm,
        connection: database,
        fields: "",
      });

      deleteFileOrDirectory(modelFile1);
      deleteFileOrDirectory(modelFile2);
    });

    it("should create a model file in src/app/http/models directory", async function() {
      const orm = "sequelize";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const modelName = "Command";
      const modelFile = path.join(modelsPath, orm, `${modelName.toLowerCase()}.js`);

      expect(pathExists(modelFile)).to.be.false;

      await this.command([modelName], {}, logger);
      restore();

      const msg = escapeRegExp(
        `Model [${normalizePath(modelFile)}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(pathExists(modelFile)).to.equal(true);
      assertModelFile(modelFile, {
        name: "Command",
        table: "commands",
        orm: orm,
        connection: "default",
        fields: "",
      });

      deleteFileOrDirectory(modelFile);
    });
  });

  describe(`${GENERATE_ROUTE_COMMAND}(name, [options])`, function() {
    before(function(done) {
      this.command = commands[GENERATE_ROUTE_COMMAND].handler;
      done();
    });

    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await this.command([], {}, logger);
      restore();

      const expected = new RegExp(
        "The Route name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_ROUTE_COMMAND} --help for help`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
    });

    it("should create regular web routes by default", async function() {
      const routeName = "commands";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "CommandController";
      const controllerFile = "command-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.false;

      const { sinonSpy, restore } = spyOnConsoleOutput();

      await this.command([routeName], {}, logger);

      restore();

      const msg = "Route created successfully.";

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.true;
    });

    it("should create API routes if the 'api' option is true", async function() {
      const routeName = "gists";
      const routeFile = path.join(routesPath, "api.js");
      const controllerName = "GistController";
      const controllerFile = "gist-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.false;

      const { sinonSpy, restore } = spyOnConsoleOutput();
      await this.command([routeName], { api: true }, logger);
      restore();

      const msg = "Route created successfully.";

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.true;
    });

    it("should create resource routes if the 'resource' option is true", async function() {
      const routeName = "twitters";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "TwitterController";
      const controllerFile = "twitter-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.false;

      const { sinonSpy, restore } = spyOnConsoleOutput();
      await this.command([routeName], { resource: true }, logger);
      restore();

      const msg = "Route created successfully.";

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.true;
    });

    it("should always create resource routes as web routes", async function() {
      const routeName = "tweets";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "TweetController";
      const controllerFile = "tweet-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.false;

      const { sinonSpy, restore } = spyOnConsoleOutput();
      await this.command([routeName], { api: true, resource: true }, logger);
      restore();

      const msg = "Route created successfully.";

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.true;
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
        const routeName = "tweeters";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "TweeterController";
        const controllerFile = "tweeter-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await this.command([routeName], {}, logger);
        restore();

        const msg = "Route created successfully.";

        expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);

        // Assert that the route was created inside the 'web' folder.
        expect(pathExists(routeFile)).to.equal(true);
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
        const routeName = "twizzers";
        const routeDirectory = path.join(routesPath, "api");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "TwizzerController";
        const controllerFile = "twizzer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await this.command([routeName], {api: true }, logger);
        restore();

        const msg = "Route created successfully.";

        expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);

        // Assert that the route was created inside the 'api' folder.
        expect(pathExists(routeFile)).to.equal(true);
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
        const routeName = "tweezers";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "TweezerController";
        const controllerFile = "tweezer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await this.command([routeName], { api: true, resource: true }, logger);
        restore();

        const msg = "Route created successfully.";

        expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);

        // Assert that the route was created inside the 'web' folder.
        expect(pathExists(routeFile)).to.equal(true);
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
        const routeName = "wizzers";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "WizzerController";
        const controllerFile = "wizzer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await this.command([routeName], {}, logger);
        restore();

        const msg = "Route created successfully.";

        expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);

        // Assert that the route was created inside the 'web' folder.
        expect(pathExists(routeFile)).to.equal(true);
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

        await this.command([routeName], {}, logger);
        restore2();

        const expected = new RegExp("Route already exists.");

        expect(sinonSpy2.calledOnce).to.be.true;
        expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
        expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

        deleteFileOrDirectory(routeFile);
      });
    });
  });
});
