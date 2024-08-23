"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const util = require("node:util");
const commands = require("../src/commands").commands;
const {
  BUILDER_NAME, FRAMEWORK_NAME,
  GENERATE_CONTROLLER_COMMAND, GENERATE_MIGRATION_COMMAND,
  GENERATE_MODEL_COMMAND, GENERATE_ROUTE_COMMAND,
  MANUAL_HELP, MIGRATION_TYPES,
  RUN_MIGRATION_COMMAND, TEMPLATES_DIR
} = require("../src/helpers/constants");
const { copy, createDirectory, deleteFileOrDirectory, getFilename, pathExists,
  readLinesFromFile
} = require("../src/helpers/file-system");
const { marker } = require("../src/helpers/printer");
const { getDatabaseConnection } = require("../src");
const createAssertions = require("./test-helpers/assertions-helper");
const { chai, spyOnConsoleOutput } = require("./test-helpers/test-helper");

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
let tableExists;
let verifyInlineRouteExists;
let normalizePath;

const EOL = os.EOL;
const PADDING = "  ";
const chdir = process.chdir;
const currDir = __dirname.replace(/\\/g, "/");
const commandsTestApp = `${currDir}/commands-test-app`;

function normalizeHelpManual(manual) {
  return manual.replace(/\r?\n/gm, "");
}

describe("commands", function() {
  this.timeout(1000 * 120);

  let expect;

  before(async function() {
    expect = (await chai()).expect;

    copy(`${currDir}/test-app`, commandsTestApp);
    chdir(commandsTestApp);

    httpPath = path.join(process.cwd(), "src", "app", "http");
    controllersPath = path.join(httpPath, "controllers");
    migrationsPath = path.join(process.cwd(), "src", "database", "migrations");
    modelsPath = path.join(httpPath, "models");
    routesPath = path.join(process.cwd(), "src", "routes");

    const assertions = createAssertions({ expect, TEMPLATES_DIR });

    assertControllerFile = assertions.assertControllerFile;
    assertMigrationFile = assertions.assertMigrationFile;
    assertModelFile = assertions.assertModelFile;
    assertStandaloneRouteFile = assertions.assertStandaloneRouteFile;
    collectionExists = assertions.collectionExists;
    tableExists = assertions.tableExists;
    verifyInlineRouteExists = assertions.verifyInlineRouteExists;
    normalizePath = assertions.normalizePath;

    [this.mongooseConnection, this.sequelizeConnection] = await Promise.all([
      getDatabaseConnection("mongodb"),
      getDatabaseConnection("sqlite")
    ]);
  });

  after(async function() {
    expect = null;

    try {
      await Promise.all([
        this.mongooseConnection.dropCollection("migrations"),
        this.sequelizeConnection.query("DROP TABLE IF EXISTS `SequelizeMeta`"),
      ]);

      await this.sequelizeConnection.close();

      chdir(currDir);

      setTimeout(() => deleteFileOrDirectory(commandsTestApp), 500);
    } catch(err) {
      fs.appendFileSync(
        `${currDir}/.logs/console.error`,
        util.inspect(err, { depth: 12 })
      );
    }
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
      chdir(this.parentDir);
      this.command();
      restore();

      const expected = this.versionInfo.trim();
      const actual = (sinonSpy.getCall(0).args[0]).trim();

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);
      chdir(commandsTestApp);
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

      this.command();
      restore();

      const expected1 = new RegExp("Generating Controller...");
      const expected2 = new RegExp(
        "The Controller name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_CONTROLLER_COMMAND} --help for help`
      );

      expect(sinonSpy.called).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected1);
      expect(sinonSpy.getCall(1).args[0]).to.match(expected2);
      expect(sinonSpy.calledWithMatch(expected2)).to.equal(true);
      expect(pathExists(path.join(controllersPath, "undefined-controller.js")))
        .to.be.false;
      done();
    });

    it("should fail if the controller exists and the 'force' option is not true", function(done) {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const controllerName = "commands-test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      // Create the controller the first time
      this.command(controllerName);
      restore();

      const r1 = `Generating Controller '${controllerName}'`;
      const r2 = `Created: src > app > http > controllers > ${controllerName}.js`;
      const r3 = `Controller ${normalizePath(controllerFile)} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r3))).to.equal(true);
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

      this.command(controllerName, { database: "mongodb" });
      restore2();

      const expected1 = new RegExp("Generating Controller...");
      const expected2 = new RegExp(
        `Controller File at ${normalizePath(controllerFile)} already exists. ` +
        "To overwrite it, use --force option."
      );

      expect(sinonSpy2.called).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected1);
      expect(sinonSpy2.getCall(1).args[0]).to.match(expected2);
      expect(sinonSpy2.calledWithMatch(expected2)).to.equal(true);

      deleteFileOrDirectory(controllerFile);
      done();
    });

    it("should overwrite an existing controller if the 'force' option is true", function(done) {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const controllerName = "command-test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      // Create the controller the first time
      this.command(controllerName, { database: "sqlite" });
      restore();

      let r1 = `Generating Controller '${controllerName}'`;
      let r2 = `Created: src > app > http > controllers > ${controllerName}.js`;
      let r3 = `Controller ${controllerFile.replace(/\\/g, "/")} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r3))).to.equal(true);
      expect(pathExists(controllerFile)).to.equal(true);
      assertControllerFile(controllerFile, {
        name: "CommandTestController",
        model: "CommandTest",
        entity: "command_test",
        orm: "sequelize",
        isResource: false,
      });

      // Re-create the controller a second time
      // with the 'overwrite' option set to true.
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

      this.command(controllerName, { database: "mongodb", force: true });
      restore2();

      r1 = `Generating Controller '${controllerName}'`;
      r2 = `Replaced: src > app > http > controllers > ${controllerName}.js`;
      r3 = `Controller ${controllerFile.replace(/\\/g, "/")} generated.`;

      expect(sinonSpy2.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy2.calledWithMatch(new RegExp(r2))).to.equal(true);
      expect(sinonSpy2.calledWithMatch(new RegExp(r3))).to.equal(true);
      expect(pathExists(controllerFile)).to.equal(true);
      assertControllerFile(controllerFile, {
        name: "CommandTestController",
        model: "CommandTest",
        entity: "command_test",
        orm: "mongoose",
        isResource: false,
      });

      deleteFileOrDirectory(controllerFile);
      done();
    });

    it("should create a controller file in src/app/http/controllers directory", function(done) {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const controllerName = "test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      this.command(controllerName);
      restore();

      const r1 = `Generating Controller '${controllerName}'`;
      const r2 = `Created: src > app > http > controllers > ${controllerName}.js`;
      const r3 = `Controller ${normalizePath(controllerFile)} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r3))).to.equal(true);
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

      this.command();
      restore();

      const expected1 = new RegExp("Generating Migration...");
      const expected2 = new RegExp(
        "The Migration name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_MIGRATION_COMMAND} --help for help`
      );

      expect(sinonSpy.calledTwice).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected1);
      expect(sinonSpy.getCall(1).args[0]).to.match(expected2);
      expect(sinonSpy.calledWithMatch(expected2)).to.equal(true);
      expect(pathExists(path.join(migrationsPath, "undefined-migration.js")))
        .to.be.false;
    });

    it("should fail if an invalid 'type' option is passed", async function() {
      const database = "mongodb";
      const type = "command-table";
      const migrationName = "command-peoples-table";
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await this.command(migrationName, { database,type });

      restore();

      const expected1 = new RegExp(`Generating Migration '${migrationName}'...`);
      const expected2 = new RegExp(
        `Invalid migration type '${type}' specified. ` +
        `Valid migration types include ${MIGRATION_TYPES.join(", ")}.`
      );

      expect(sinonSpy.calledTwice).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected1);
      expect(sinonSpy.calledWithMatch(expected2)).to.equal(true);
    });

    it("should fail if a migration with the same name already exists for given ORM", async function() {
      const orm = "sequelize";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const migrationName = "delete-command-email-field";
      const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

      expect(pathExists(migrationFile)).to.be.false;

      // Create the migration the first time
      const destination = await this.command(migrationName);
      restore();

      const r1 = `Created: src > database > migrations > ${orm} > ${getFilename(destination, true)}`;
      const r2 = `Migration ${destination} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
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
      await this.command(migrationName);
      restore2();

      const expected = new RegExp(
        `Migration '${migrationName}' already exists. Kindly use a different name.`
      );

      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);
      deleteFileOrDirectory(destination);
    });

    it("should create a migration file in src/databases/migrations/<ORM> directory", async function() {
      const orm = "sequelize";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const migrationName = "delete-command-name-field";
      const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

      expect(pathExists(migrationFile)).to.be.false;

      const destination = await this.command(migrationName);
      restore();

      const r1 = `Created: src > database > migrations > ${orm} > ${getFilename(destination, true)}`;
      const r2 = `Migration ${destination} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
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

          const destination = await this.command(migrationName, { database });
          restore();

          const r1 = `Created: src > database > migrations > ${orm} > ${getFilename(destination, true)}`;
          const r2 = `Migration ${destination} generated.`;

          expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
          expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
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

      await this.mongooseConnection.db.collection("migrations").deleteMany({
        //name: { $regex: "(alter|create|update)-users-table" },
      });
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
        this.makeMigrationCommand(migrationName, { database }),
        this.makeModelCommand(modelName, { database })
      ]);

      await this.command({ database });
      restore();

      expect(await collectionExists(collection, connection)).to.be.true;

      await connection.dropCollection(collection);
    });

    it("should run the migrations for non-mongodb --database option", async function() {
      const database = "sqlite";
      const migrationName = "create-zebras-table";
      const modelName = "Zebra";
      const connection = this.sequelizeConnection;
      const table = "zebras";
      const { restore } = spyOnConsoleOutput();

      expect(await tableExists(table, connection)).to.be.false;

      await Promise.all([
        this.makeModelCommand(modelName, { database }),
        this.makeMigrationCommand(migrationName, { database })
      ]);

      await this.command({ database });

      restore();

      expect(await tableExists(table, connection)).to.be.true;

      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    });

    it("should run the migrations for the --database option 'default'", async function() {
      const database = "default";
      const migrationName = "create-penguins-table";
      const modelName = "Penguin";
      const connection = this.sequelizeConnection;
      const table = "penguins";
      const { restore } = spyOnConsoleOutput();

      expect(await tableExists(table, connection)).to.be.false;

      await Promise.all([
        this.makeMigrationCommand(migrationName, { database }),
        this.makeModelCommand(modelName, { database })
      ]);

      await this.command({ database });

      restore();

      expect(await tableExists(table, connection)).to.be.true;

      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    });

    it("should run all migrations if the --database option is not specified", async function() {
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
        this.makeMigrationCommand(mongooseMigrationName, {database: "mongodb"  }),
        this.makeModelCommand(mongooseModelName, { database: "mongodb" }),
        this.makeMigrationCommand(sequelizeMigrationName, { database: "sqlite" }),
        this.makeModelCommand(sequelizeModelName, { database: "sqlite" })
      ]);

      await this.command();
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

      await this.command();
      restore();

      const expected1 = new RegExp("Generating Model...");
      const expected2 = new RegExp(
        "The Model name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_MODEL_COMMAND} --help for help`
      );

      expect(sinonSpy.calledTwice).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected1);
      expect(sinonSpy.calledWithMatch(expected2)).to.equal(true);
      expect(pathExists(path.join(modelsPath, "undefined.js")))
        .to.be.false;
    });

    it("should fail if the model exists and the 'force' option is not true", async function() {
      const orm = "sequelize";
      const database = "sqlite";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const modelName = "CommandFalse";
      const filename = "command-false.js";
      const modelFile = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile)).to.be.false;

      // Create the model the first time
      await this.command(modelName, { database });
      restore();

      const r1 = `Generating Model '${modelName}'...`;
      const r2 = `Created: src > app > http > models > ${orm} > ${filename}`;
      const r3 = `Model ${normalizePath(modelFile)} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r3))).to.equal(true);
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

      await this.command(modelName, { database });
      restore2();

      const expected1 = new RegExp(`Generating Model '${modelName}'...`);
      const expected2 = new RegExp(
        `Model File at ${normalizePath(modelFile)} already exists. ` +
        "To overwrite it, use --force option."
      );

      expect(sinonSpy2.calledTwice).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected1);
      expect(sinonSpy2.getCall(1).args[0]).to.match(expected2);
      expect(sinonSpy2.calledWithMatch(expected2)).to.equal(true);

      deleteFileOrDirectory(modelFile);
    });

    it("should overwrite an existing model if the 'force' option is true", async function() {
      const orm = "sequelize";
      const database = "sqlite";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const modelName = "CommandTrue";
      const filename = "command-true.js";
      const modelFile = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile)).to.be.false;

      // Create the model the first time
      await this.command(modelName, { database });
      restore();

      let r1 = `Generating Model '${modelName}'...`;
      let r2 = `Created: src > app > http > models > ${orm} > ${filename}`;
      let r3 = `Model ${modelFile.replace(/\\/g, "/")} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r3))).to.equal(true);
      expect(pathExists(modelFile)).to.equal(true);
      assertModelFile(modelFile, {
        name: modelName,
        table: "command_trues",
        orm: orm,
        connection: database,
        fields: "",
      });

      // Re-create the controller a second time
      // with the 'overwrite' option set to true.
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

      await this.command(modelName, { database, force: true });
      restore2();

      r1 = `Generating Model '${modelName}'...`;
      r2 = `Replaced: src > app > http > models > ${orm} > ${filename}`;
      r3 = `Model ${normalizePath(modelFile)} generated.`;

      expect(sinonSpy2.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy2.calledWithMatch(new RegExp(r2))).to.equal(true);
      expect(sinonSpy2.calledWithMatch(new RegExp(r3))).to.equal(true);
      expect(pathExists(modelFile)).to.equal(true);
      assertModelFile(modelFile, {
        name: modelName,
        table: "command_trues",
        orm: orm,
        connection: database,
        fields: "",
      });

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
      await this.command(modelName, { database });
      restore();

      let r1 = `Created: src > app > http > models > ${orm} > ${filename}`;
      let r2 = `Model ${normalizePath(modelFile1)} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
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

      await this.command(modelName, { database });
      restore2();

      r1 = `Created: src > app > http > models > ${orm} > ${filename}`;
      r2 = `Model ${normalizePath(modelFile2)} generated.`;

      expect(sinonSpy2.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy2.calledWithMatch(new RegExp(r2))).to.equal(true);
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

      await this.command(modelName);
      restore();

      const r1 = `Created: src > app > http > models > ${orm} > ${modelName.toLowerCase()}.js`;
      const r2 = `Model ${normalizePath(modelFile)} generated.`;

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
      expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
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

      await this.command();
      restore();

      const expected1 = /Generating Route.../;
      const expected2 = new RegExp(
        "The Route name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_ROUTE_COMMAND} --help for help`
      );

      expect(sinonSpy.calledTwice).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected1);
      expect(sinonSpy.calledWithMatch(expected2)).to.equal(true);
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

      await this.command(routeName);

      restore();

      const r1 = "Route information written to: src > routes > web.js";

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
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
      await this.command(routeName, { api: true });
      restore();

      const r1 = "Route information written to: src > routes > api.js";

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
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
      await this.command(routeName, { resource: true });
      restore();

      const r1 = "Route information written to: src > routes > web.js";

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
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
      await this.command(routeName, { api: true, resource: true });
      restore();

      const r1 = "Route information written to: src > routes > web.js";

      expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
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
        await this.command(routeName);
        restore();

        const r1 = `Generating Route '${routeName}'...`;
        const r2 = `Created: src > routes > web > ${routeName}.js`;
        const r3 = `Route ${normalizePath(routeFile)} generated.`;

        expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
        expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
        expect(sinonSpy.calledWithMatch(new RegExp(r3))).to.equal(true);

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
        await this.command(routeName, {api: true });
        restore();

        const r1 = `Generating Route '${routeName}'...`;
        const r2 = `Created: src > routes > api > ${routeName}.js`;
        const r3 = `Route ${normalizePath(routeFile)} generated.`;

        expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
        expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
        expect(sinonSpy.calledWithMatch(new RegExp(r3))).to.equal(true);

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
        await this.command(routeName, { api: true, resource: true });
        restore();

        const r1 = `Generating Route '${routeName}'...`;
        const r2 = `Created: src > routes > web > ${routeName}.js`;
        const r3 = `Route ${normalizePath(routeFile)} generated.`;

        expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
        expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);
        expect(sinonSpy.calledWithMatch(new RegExp(r3))).to.equal(true);

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

      it("should fail if the route exists and the 'force' option is not true", async function() {
        const routeName = "wizzers";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "WizzerController";
        const controllerFile = "wizzer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await this.command(routeName);
        restore();

        const r1 = `Created: src > routes > web > ${routeName}.js`;
        const r2 = `Route ${normalizePath(routeFile)} generated.`;

        expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
        expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);

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

        await this.command(routeName);
        restore2();

        const expected = new RegExp(
          `Route File at ${normalizePath(routeFile)} already exists. ` +
          "To overwrite it, use --force option."
        );

        expect(sinonSpy2.calledTwice).to.be.true;
        expect(sinonSpy2.getCall(1).args[0]).to.match(expected);
        expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

        deleteFileOrDirectory(routeFile);
      });

      it("should overwrite an existing route if the --force option is set", async function() {
        const routeName = "weezers";
        const routeDirectory = path.join(routesPath, "api");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "WeezerController";
        const controllerFile = "weezer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await this.command(routeName, { api: true });
        restore();

        let r1 = `Created: src > routes > api > ${routeName}.js`;
        let r2 = `Route ${normalizePath(routeFile)} generated.`;

        expect(sinonSpy.calledWithMatch(new RegExp(r1))).to.equal(true);
        expect(sinonSpy.calledWithMatch(new RegExp(r2))).to.equal(true);

        // Assert that the route was created inside the 'api' folder.
        expect(pathExists(routeFile)).to.equal(true);
        assertStandaloneRouteFile(routeFile, {
          name: routeName,
          controllerName: controllerName,
          controllerFilename: controllerFile,
          isResourceRoute: false,
        });

        // Assert that the route was not created inside the 'api.js' file.
        expect(verifyInlineRouteExists(routeFile, {
          route: routeName,
          controller: controllerName,
          controllerFile: controllerFile,
          isResourceRoute: false,
        })).to.be.false;

        // Re-create the route with the 'overwrite' option set to true.
        const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

        await this.command(routeName, { api: true, force: true });

        restore2();

        r1 = `Replaced: src > routes > api > ${routeName}.js`;
        r2 = `Route ${normalizePath(routeFile)} generated.`;

        expect(sinonSpy2.calledWithMatch(new RegExp(r1))).to.equal(true);
        expect(sinonSpy2.calledWithMatch(new RegExp(r2))).to.equal(true);
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
    });
  });
});
