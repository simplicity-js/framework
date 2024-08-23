const os = require("node:os");
const path = require("node:path");
const mongoose = require("mongoose");
const { readFromFile, writeToFile } = require("../../src/helpers/file-system");

module.exports = function({ expect, TEMPLATES_DIR }) {
  return {
    assertControllerFile,
    assertMigrationFile,
    assertModelFile,
    assertStandaloneRouteFile,
    clearInlineRoute,
    collectionExists,
    normalizeHelpManual,
    normalizePath,
    tableExists,
    verifyInlineRouteExists,
  };

  function assertControllerFile(controllerFile, options) {
    const { name, model, entity, orm, isResource } = options || {};

    const templatePath = `${TEMPLATES_DIR}/${orm}`;
    const templateFile = isResource ? "resource-controller" : "controller";
    const template = `${templatePath}/${templateFile}.stub`;

    const controllerData = readFromFile(controllerFile);
    const templateData = readFromFile(template);
    const parsedTemplateData = templateData
      .replace(/\$\$CONTROLLER_NAME\$\$/gm, name)
      .replace(/\$\$MODEL_NAME\$\$/gm, model)
      .replace(/\$\$TABLE_ENTITY\$\$/gm, entity);

    expect(controllerData).to.equal(parsedTemplateData);
  }

  function assertMigrationFile(migrationFile, options) {
    const {
      fields = "", name, type, model, modelFilename, table, orm
    } = options || {};

    const templatePath = `${TEMPLATES_DIR}/${orm}`;
    const templateFile = `migration_${type}`;
    const template = `${templatePath}/${templateFile}.stub`;
    const filename = path.basename(migrationFile);
    const timestampSeparatorIndex = filename.indexOf("-");
    const migrationName = filename.slice(
      timestampSeparatorIndex + 1,
      filename.lastIndexOf(".")
    );

    const migrationData = readFromFile(migrationFile);
    const templateData = readFromFile(template);
    const parsedTemplateData = templateData
      .replace(/\$\$MODEL_NAME\$\$/gm, model)
      .replace(/\$\$TABLE_NAME\$\$/gm, table)
      .replace(/\$\$MIGRATION_FIELDS\$\$/, fields)
      .replace(/\$\$MODEL_FILE_NAME\$\$/gm, modelFilename);

    expect(name).to.equal(migrationName);
    expect(migrationData).to.equal(parsedTemplateData);
  }

  function assertModelFile(modelFile, options) {
    const { connection, fields, name, orm, table } = options || {};

    const templatePath = `${TEMPLATES_DIR}/${orm}`;
    const templateFile = "model";
    const template = `${templatePath}/${templateFile}.stub`;

    const modelData = readFromFile(modelFile);
    const templateData = readFromFile(template);
    const parsedTemplateData = templateData
      .replace(/\$\$MODEL_NAME\$\$/gm, name)
      .replace(/\$\$TABLE_NAME\$\$/gm, table)
      .replace(/\$\$CONNECTION\$\$/gm, connection)
      .replace(/\$\$COLLECTION_NAME\$\$/gm, table)
      .replace(/\$\$MODEL_FIELDS\$\$/gm, fields);

    expect(modelData).to.equal(parsedTemplateData);
  }

  function assertStandaloneRouteFile(routeFile, options) {
    const { name, controllerName, controllerFilename, isResourceRoute
    } = options || {};

    const templatePath = `${TEMPLATES_DIR}/routes`;
    const templateFile = isResourceRoute ? "resource-route" : "route";
    const template = `${templatePath}/${templateFile}-standalone.stub`;

    const routeData = readFromFile(routeFile);
    const templateData = readFromFile(template);
    const parsedTemplateData = templateData
      .replace(/\$\$CONTROLLER_FILE_NAME\$\$/gm, controllerFilename)
      .replace(/\$\$CONTROLLER_NAME\$\$/gm, controllerName)
      .replace(/\$\$ROUTE\$\$/gm, name) // regular route
      .replace(/\$\$RESOURCE\$\$/gm, name) // resource route
      ;//.replace(/\$\$CONTROLLER_OBJECT\$\$/gm, LCFirst(controllerName));

    expect(routeData).to.equal(parsedTemplateData);
  }

  function clearInlineRoute(routeFile, controllerName, controllerFilename, output) {
    const { EOL } = os;

    const originalContents = readFromFile(routeFile)
      .replace(`${output}${EOL}${EOL}`, "")
      .replace(
        `const ${controllerName} = require("../app/http/controllers/${controllerFilename}");${EOL}`, ""
      );

    writeToFile(routeFile, originalContents, { flag: "w" });
  }

  async function collectionExists(collectionName, connection) {
    //let collectionFound = false;

    if(connection === mongoose) {
      connection = mongoose.connection;
    }

    /*const collections = connection.collections;

    for(let collection in collections) {
      if(collection === collectionName) {
        collectionFound = true;
        break;
      }
    }

    return collectionFound;*/

    const collections = await connection.db.listCollections({
      name: collectionName
    }).toArray();

    return collections.length > 0;
  }

  function normalizeHelpManual(manual) {
    return manual.replace(/\r?\n/gm, "");
  }

  function normalizePath(path) {
    return path.replace(/\\/g, "/");
  }

  async function tableExists(tableName, connection) {
    try {
      await connection.query(`SELECT 1 FROM ${tableName} LIMIT 0`);

      return true;
    } catch(e) {
      console.log(e);

      return false;
    }
  }

  function verifyInlineRouteExists(routeFile, options) {
    const { route, controller, controllerFile, isResourceRoute } = options || {};

    const templatePath = `${TEMPLATES_DIR}/routes`;
    const template = `${templatePath}/route-group.stub`;
    const routeData = readFromFile(routeFile);
    const templateData = isResourceRoute
      ? `router.resource("${route}", ${controller});`
      : readFromFile(template);
    const parsedTemplateData = templateData
      .replace(/\$\$CONTROLLER_NAME\$\$/gm, controller)
      .replace(/\$\$CONTROLLER_FILE_NAME\$\$/gm, controllerFile)
      .replace(/\$\$BASE_PATH\$\$/gm, route);

    // We are using indexOf instead of string equality because the route file
    // already contains some default routes.
    // We are only testing that our routes were added.
    if(isResourceRoute) {
      return (
        routeData.indexOf(`router.resource("${route}", ${controller});`) > - 1 &&
        routeData.indexOf(parsedTemplateData) > -1
      );
    } else {
      return routeData.indexOf(parsedTemplateData) > -1;
    }
  }
};
