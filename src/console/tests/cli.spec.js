"use strict";

const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const util = require("node:util");
const { getDatabaseConnection } = require("../src");
const {
  BUILDER_NAME, FRAMEWORK_NAME,
  GENERATE_CONTROLLER_COMMAND, GENERATE_MIGRATION_COMMAND,
  GENERATE_MODEL_COMMAND, GENERATE_ROUTE_COMMAND,
  MANUAL_HELP, MIGRATION_TYPES,
  RUN_MIGRATION_COMMAND, TEMPLATES_DIR
} = require("../src/helpers/constants");
const { createDirectory, deleteFileOrDirectory, pathExists, readLinesFromFile
} = require("../src/helpers/file-system");
const { print, marker } = require("../src/helpers/printer");
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
const chdir = process.chdir;
const currDir = __dirname.replace(/\\/g, "/");
const testApp = `${currDir}/test-app`;
const binDir = path.join(currDir, "..", "src").replace(/\\/g, "/");

function exec(command, args) {
  args = args || [];

  return new Promise((resolve, reject) => {
    let output = "";
    const start = Date.now();

    const ps = childProcess.spawn(command, args, {
      //stdio: ["ignore", out, err],
      shell: true,
      env: { ...process.env, NODE_ENV: "test" },
    });

    ps.stdout.on("data", (data) => output += data);
    ps.stderr.on("data", (data) => output += data);
    ps.on("error", (err) => reject(err.toString()));
    ps.on("exit", (code, signal) => {
      const duration = Date.now() - start;
      resolve({ code, signal, duration });
    });

    ps.on("close", (code) => {
      if(code === 0) {
        print(output);
        resolve(output);
      } else {
        print(output);
        reject(output);
      }
    });
  });
};

function generateCommandIsValidOnAppRootOnlyMessage(command) {
  return `'${BUILDER_NAME} ${command}' can only be run ` +
  `from a ${FRAMEWORK_NAME} application root directory.`;
}

describe("cli", function() {
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

  describe("help (--help, -h)", function() {
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

    it("should display the help manual if the string 'help' is passed", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(`node ${binDir}/cli help`);
      restore();

      const expected = this.helpManual;
      const actual = normalizeHelpManual(sinonSpy.getCall(0).args[0]);

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);
    });

    it("should display the help manual if the --help option is passed", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(`node ${binDir}/cli --help`);
      restore();

      const expected = this.helpManual;
      const actual = normalizeHelpManual(sinonSpy.getCall(0).args[0]);

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);
    });

    it("should display the help manual if the -h option is passed", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(`node ${binDir}/cli -h`);
      restore();

      const expected = this.helpManual;
      const actual = normalizeHelpManual(sinonSpy.getCall(0).args[0]);

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);
    });

    it("should display the help manual if no command is passed", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(`node ${binDir}/cli`);
      restore();

      const expected = this.helpManual;
      const actual = normalizeHelpManual(sinonSpy.getCall(0).args[0]);

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);
    });
  });

  describe("version (--version, -v)", function() {
    before(function(done) {
      this.parentDir = path.dirname(__dirname);
      this.versionInfo = `${PADDING}${marker.success.text(FRAMEWORK_NAME)}${` version ${require("../package").version} (cli)`}`;
      done();
    });

    it("should display version information if the string 'version' is passed", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      chdir(this.parentDir);
      await exec(`node ${binDir}/cli version`);
      restore();

      const expected = this.versionInfo.trim();
      const actual = (sinonSpy.getCall(0).args[0]).trim();

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);

      chdir(testApp);
    });

    it("should display version information if the --version option is passed", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      chdir(this.parentDir);
      await exec(`node ${binDir}/cli --version`);
      restore();

      const expected = this.versionInfo.trim();
      const actual = (sinonSpy.getCall(0).args[0]).trim();

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);

      chdir(testApp);
    });

    it("should display version information if the -v option is passed", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      chdir(this.parentDir);
      await exec(`node ${binDir}/cli -v`);
      restore();

      const expected = this.versionInfo.trim();
      const actual = (sinonSpy.getCall(0).args[0]).trim();

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);

      chdir(testApp);
    });

    it(`should also display framework version if inside a ${FRAMEWORK_NAME} Application directory`, async function() {
      // We are inside the cli-test-app directory, so no need to chdir
      const { sinonSpy, restore } = spyOnConsoleOutput();
      await exec(`node ${binDir}/cli -v`);
      restore();

      const cwd = process.cwd();
      let expected = this.versionInfo + `${EOL}${PADDING}Framework version ${require(`${cwd}/package`).version}`;
      let actual = sinonSpy.getCall(0).args[0];

      expected = expected.replace(/\r?\n/gm, "");
      actual = actual.replace(/\r?\n/gm, "");

      expect(sinonSpy.calledOnce).to.be.true;
      expect(expected).to.equal(actual);
    });
  });

  describe(`${GENERATE_CONTROLLER_COMMAND} name [options]`, function() {
    before(function(done) {
      this.command = `node ${binDir}/cli ${GENERATE_CONTROLLER_COMMAND}`;
      done();
    });

    it(`should fail if invoked outside of a ${FRAMEWORK_NAME} application directory`, async function() {
      chdir(currDir);

      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command);

      restore();

      const expected = new RegExp(
        generateCommandIsValidOnAppRootOnlyMessage(GENERATE_CONTROLLER_COMMAND)
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);

      chdir(testApp);
    });

    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command);
      restore();

      const expected = new RegExp(
        "The Controller name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_CONTROLLER_COMMAND} --help for help`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(controllersPath, "undefined-controller.js")))
        .to.be.false;
    });

    it("should fail if the controller already exists", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const controllerName = "test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      // Create the controller the first time
      await exec(this.command, [controllerName]);
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

      // Create the failing controller with the same name as the first
      // Even with different ORMs but same name, it should still fail
      // because controllers are all stored inside the same parent directory.
      const { sinonSpy: sinonSpy2, restore: restore2 } = spyOnConsoleOutput();

      await exec(this.command, [controllerName, "--database mongodb"]);
      restore2();

      const expected = new RegExp("Controller already exists.");

      expect(sinonSpy2.calledOnce).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

      deleteFileOrDirectory(controllerFile);
    });

    it("should create a controller file in src/app/http/controllers directory", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const controllerName = "test-controller";
      const controllerFile = path.join(controllersPath, `${controllerName}.js`);

      expect(pathExists(controllerFile)).to.be.false;

      await exec(this.command, [controllerName]);
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
    });
  });

  describe(`${GENERATE_MIGRATION_COMMAND} name [options]`, function() {
    before(function(done) {
      this.command = `node ${binDir}/cli ${GENERATE_MIGRATION_COMMAND}`;
      done();
    });

    it(`should fail if invoked outside of a ${FRAMEWORK_NAME} application directory`, async function() {
      process.chdir(currDir);

      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command);

      restore();

      const expected = new RegExp(
        generateCommandIsValidOnAppRootOnlyMessage(GENERATE_MIGRATION_COMMAND)
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);

      process.chdir(testApp);
    });

    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command);
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
      const type = "split-table";
      const migrationName = "split-peoples-table";
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command, [
        migrationName,
        `--database ${database}`,
        `--type ${type}`
      ]);

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
      const migrationName = "delete-customer-email-field";
      const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

      expect(pathExists(migrationFile)).to.be.false;

      // Create the migration the first time
      await exec(this.command, [migrationName]);
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
      await exec(this.command, [migrationName]);
      restore2();

      const expected = new RegExp("Migration already exists.");

      expect(sinonSpy2.calledOnce).to.be.true;
      expect(sinonSpy2.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy2.calledWithMatch(expected)).to.equal(true);

      deleteFileOrDirectory(destination);
    });

    it("should create a migration file in src/databases/migrations/<ORM> directory", async function() {
      const orm = "sequelize";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const migrationName = "delete-customer-name-field";
      const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

      expect(pathExists(migrationFile)).to.be.false;

      await exec(this.command, [migrationName]);
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
        "alter-customers-table",
        "create-customers-table",
        "update-customers-table",
      ];

      for(const migrationName of migrationNames) {
        for(const database of databases) {
          const orm = database === "mongodb" ? "mongoose" : "sequelize";
          const { sinonSpy, restore } = spyOnConsoleOutput();
          const migrationFile = path.join(migrationsPath, orm, `${migrationName}.js`);

          expect(pathExists(migrationFile)).to.be.false;

          await exec(this.command, [migrationName, `--database ${database}`]);
          restore();

          const destination = parseMigrationPathFromSinonCall(sinonSpy);

          const msg = escapeRegExp(`Migration [${destination}] created successfully.`);

          expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
          expect(pathExists(destination)).to.equal(true);
          assertMigrationFile(destination, {
            fields: "",
            name: migrationName,
            type: migrationName.replace("customers-", ""),
            model: "Customer",
            modelFilename: "customer",
            table: "customers",
            orm: orm,
          });

          deleteFileOrDirectory(destination);
        }
      }
    });
  });

  describe(`${RUN_MIGRATION_COMMAND} [options]`, function() {
    before(async function() {
      this.command = `node ${binDir}/cli ${RUN_MIGRATION_COMMAND}`;
      this.makeMigrationCommand = `node ${binDir}/cli ${GENERATE_MIGRATION_COMMAND}`;
      this.makeModelCommand = `node ${binDir}/cli ${GENERATE_MODEL_COMMAND}`;

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

    it(`should fail if invoked outside of a ${FRAMEWORK_NAME} application directory`, async function() {
      chdir(currDir);

      const { sinonSpy, restore } = spyOnConsoleOutput();
      await exec(this.command);
      restore();

      const expected = new RegExp(
        generateCommandIsValidOnAppRootOnlyMessage(RUN_MIGRATION_COMMAND)
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);

      chdir(testApp);
    });

    it("should run the migrations for --database option 'mongodb'", async function() {
      this.timeout(1000 * 240);

      const database = "mongodb";
      const migrationName = "create-lions-table";
      const modelName = "Lion";
      const collection = "lions";
      const connection = this.mongooseConnection;
      const { restore } = spyOnConsoleOutput();

      expect(await collectionExists(collection, connection)).to.be.false;

      await Promise.all([
        exec(this.makeMigrationCommand, [migrationName, `--database ${database}`]),
        exec(this.makeModelCommand, [modelName, `--database ${database}`])
      ]);

      await normalizeMongooseMigrationFilesForTesting(testApp, modelName);
      await exec(this.command, [`--database ${database}`]);
      restore();

      expect(await collectionExists(collection, connection)).to.be.true;

      await connection.dropCollection(collection);
    });

    it("should run the migrations for non-mongodb --database option", async function() {
      const database = "sqlite";
      const migrationName = "create-tigers-table";
      const modelName = "Tiger";
      const connection = this.sequelizeConnection;
      const table = "tigers";
      const { restore } = spyOnConsoleOutput();

      expect(await tableExists(table, connection)).to.be.false;

      await Promise.all([
        exec(this.makeModelCommand, [modelName, `--database ${database}`]),
        exec(this.makeMigrationCommand, [migrationName, `--database ${database}`])
      ]);

      await exec(this.command, [`--database ${database}`]);

      restore();

      expect(await tableExists(table, connection)).to.be.true;

      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    });

    it("should run the migrations for the --database option 'default'", async function() {
      const database = "default";
      const migrationName = "create-pigeons-table";
      const modelName = "Pigeon";
      const connection = this.sequelizeConnection;
      const table = "pigeons";
      const { restore } = spyOnConsoleOutput();

      expect(await tableExists(table, connection)).to.be.false;

      await Promise.all([
        exec(this.makeMigrationCommand, [migrationName, `--database ${database}`]),
        exec(this.makeModelCommand, [modelName, `--database ${database}`])
      ]);

      await exec(this.command, [`--database ${database}`]);

      restore();

      expect(await tableExists(table, connection)).to.be.true;

      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    });

    it("should run all migrations if the --database option is not specified", async function() {
      const mongooseMigrationName = "create-elephants-table";
      const mongooseModelName = "Elephant";
      const mongooseConn = this.mongooseConnection;
      const collection = "elephants";

      const sequelizeMigrationName = "create-monkeys-table";
      const sequelizeModelName = "Monkey";
      const sequelizeConn = this.sequelizeConnection;
      const table = "monkeys";

      const { restore } = spyOnConsoleOutput();

      expect(await collectionExists(collection, mongooseConn)).to.be.false;
      expect(await tableExists(table, sequelizeConn)).to.be.false;

      await Promise.all([
        exec(this.makeMigrationCommand, [mongooseMigrationName, "--database mongodb"]),
        exec(this.makeModelCommand, [mongooseModelName, "--database mongodb"]),
        exec(this.makeMigrationCommand, [sequelizeMigrationName, "--database sqlite"]),
        exec(this.makeModelCommand, [sequelizeModelName, "--database sqlite"])
      ]);

      await normalizeMongooseMigrationFilesForTesting(testApp, mongooseModelName);
      await exec(this.command);
      restore();

      expect(await collectionExists(collection, mongooseConn)).to.be.true;
      expect(await tableExists(table, sequelizeConn)).to.be.true;

      await Promise.all([
        mongooseConn.dropCollection(collection),
        sequelizeConn.query(`DROP TABLE IF EXISTS \`${table}\``)
      ]);
    });
  });

  describe(`${GENERATE_MODEL_COMMAND} name [options]`, function() {
    before(function(done) {
      this.command = `node ${binDir}/cli ${GENERATE_MODEL_COMMAND}`;
      done();
    });

    it(`should fail if invoked outside of a ${FRAMEWORK_NAME} application directory`, async function() {
      chdir(currDir);

      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command);

      restore();

      const expected = new RegExp(
        generateCommandIsValidOnAppRootOnlyMessage(GENERATE_MODEL_COMMAND)
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);

      chdir(testApp);
    });

    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command);
      restore();

      const expected = new RegExp(
        "The Model name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_MODEL_COMMAND} --help for help`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
      expect(pathExists(path.join(modelsPath, "undefined.js")))
        .to.be.false;
    });

    it("should fail if the model already exists", async function() {
      const orm = "sequelize";
      const database = "sqlite";
      const { sinonSpy, restore } = spyOnConsoleOutput();
      const modelName = "OverwriteFalse";
      const filename = "overwrite-false.js";
      const modelFile = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile)).to.be.false;

      // Create the model the first time
      await exec(this.command, [modelName, `--database ${database}`]);
      restore();

      const msg = escapeRegExp(
        `Model [${normalizePath(modelFile)}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
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

      await exec(this.command, [modelName, `--database ${database}`]);
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
      const modelName = "SameName";
      const filename = "same-name.js";
      const tableName = "same_names";
      const modelFile1 = path.join(modelsPath, orm, filename);

      expect(pathExists(modelFile1)).to.be.false;

      // Create the first model with "sequelize" as the ORM
      // It will be stored in the app/http/models/sequelize directory.
      await exec(this.command, [modelName, `--database ${database}`]);
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

      await exec(this.command, [modelName, `--database ${database}`]);
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
      const modelName = "Test";
      const modelFile = path.join(modelsPath, orm, `${modelName.toLowerCase()}.js`);

      expect(pathExists(modelFile)).to.be.false;

      await exec(this.command, [modelName]);
      restore();

      const msg = escapeRegExp(
        `Model [${normalizePath(modelFile)}] created successfully.`);

      expect(sinonSpy.calledWithMatch(new RegExp(msg))).to.equal(true);
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
  });

  describe(`${GENERATE_ROUTE_COMMAND} name [options]`, function() {
    before(function(done) {
      this.command = `node ${binDir}/cli ${GENERATE_ROUTE_COMMAND}`;
      done();
    });

    it(`should fail if invoked outside of a ${FRAMEWORK_NAME} application directory`, async function() {
      chdir(currDir);

      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command);

      restore();

      const expected = new RegExp(
        generateCommandIsValidOnAppRootOnlyMessage(GENERATE_ROUTE_COMMAND)
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);

      chdir(testApp);
    });

    it("should fail if the 'name' argument is missing", async function() {
      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command);
      restore();

      const expected = new RegExp(
        "The Route name is required. " +
        `Type ${BUILDER_NAME} ${GENERATE_ROUTE_COMMAND} --help for help`
      );

      expect(sinonSpy.calledOnce).to.be.true;
      expect(sinonSpy.getCall(0).args[0]).to.match(expected);
      expect(sinonSpy.calledWithMatch(expected)).to.equal(true);
    });

    it("should create regular web routes by default", async function() {
      const routeName = "posts";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "PostController";
      const controllerFile = "post-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.false;

      const { sinonSpy, restore } = spyOnConsoleOutput();

      await exec(this.command, [routeName]);

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

    it("should create API routes if the --api option is set", async function() {
      const routeName = "posts";
      const routeFile = path.join(routesPath, "api.js");
      const controllerName = "PostController";
      const controllerFile = "post-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: false,
      })).to.be.false;

      const { sinonSpy, restore } = spyOnConsoleOutput();
      await exec(this.command, [routeName, "--api"]);
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

    it("should create resource routes if the --resource option is set", async function() {
      const routeName = "users";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "UserController";
      const controllerFile = "user-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.false;

      const { sinonSpy, restore } = spyOnConsoleOutput();
      await exec(this.command, [routeName, "--resource"]);
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
      const routeName = "comments";
      const routeFile = path.join(routesPath, "web.js");
      const controllerName = "CommentController";
      const controllerFile = "comment-controller";

      expect(verifyInlineRouteExists(routeFile, {
        route: routeName,
        controller: controllerName,
        controllerFile: controllerFile,
        isResourceRoute: true,
      })).to.be.false;

      const { sinonSpy, restore } = spyOnConsoleOutput();
      await exec(this.command, [routeName, "--api", "--resource"]);
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
        const routeName = "customers";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "CustomerController";
        const controllerFile = "customer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await exec(this.command, [routeName]);
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
        const routeName = "customers";
        const routeDirectory = path.join(routesPath, "api");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "CustomerController";
        const controllerFile = "customer-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await exec(this.command, [routeName, "--api"]);
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
        const routeName = "members";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "MemberController";
        const controllerFile = "member-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await exec(this.command, [routeName, "--api", "--resource"]);
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
        const routeName = "tenants";
        const routeDirectory = path.join(routesPath, "web");
        const routeFile = path.join(routeDirectory, `${routeName}.js`);
        const controllerName = "TenantController";
        const controllerFile = "tenant-controller";

        expect(pathExists(routeFile)).to.be.false;

        const { sinonSpy, restore } = spyOnConsoleOutput();
        await exec(this.command, [routeName]);
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

        await exec(this.command, [routeName]);
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
