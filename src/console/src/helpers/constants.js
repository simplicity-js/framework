const path = require("node:path");

// template
const TEMPLATES_DIR = `${path.dirname(__dirname).replace(/\\/g, "/")}/generators/templates`;
const COMPONENTS_MANUAL_TEMPLATES_DIR = `${TEMPLATES_DIR}/manual/components`;
const ROUTE_TEMPLATES_DIR = `${TEMPLATES_DIR}/routes`;
const GENERATE_COMMAND = "make";
const MIGRATE_COMMAND = "migrate";

exports.BUILDER_NAME = "bob";
exports.FRAMEWORK_NAME = "Simplicity";
exports.TEMPLATES_DIR = TEMPLATES_DIR;

// destination target
exports.MODEL_FOLDER_DESTINATION = "src/app/http/models";
exports.CONTROLLER_FOLDER_DESTINATION = "src/app/http/controllers";
exports.ROUTE_FOLDER_DESTINATION = "src/routes";
exports.MIGRATION_FOLDER_DESTINATION = "src/database/migrations";

exports.ROUTE_TEMPLATE = `${ROUTE_TEMPLATES_DIR}/route-standalone.stub`;
exports.ROUTE_GROUP_TEMPLATE = `${ROUTE_TEMPLATES_DIR}/route-group.stub`;
exports.RESOURCE_ROUTE_TEMPLATE = `${ROUTE_TEMPLATES_DIR}/resource-route-standalone.stub`;

// help manual
exports.MANUAL_HELP = `${TEMPLATES_DIR}/manual/help.stub`;
exports.RUN_MIGRATION_HELP = `${TEMPLATES_DIR}/manual/migrate-api_help.stub`;
exports.NEW_PROJECT_HELP = `${TEMPLATES_DIR}/manual/project/create-project-api_help.stub`;
exports.GENERATE_HELP = `${COMPONENTS_MANUAL_TEMPLATES_DIR}/make-api_help.stub`;
exports.GENERATE_CONTROLLER_HELP = `${COMPONENTS_MANUAL_TEMPLATES_DIR}/make-controller-api_help.stub`;
exports.GENERATE_MODEL_HELP = `${COMPONENTS_MANUAL_TEMPLATES_DIR}/make-model-api_help.stub`;
exports.GENERATE_MIGRATION_HELP = `${COMPONENTS_MANUAL_TEMPLATES_DIR}/make-migration-api_help.stub`;
exports.GENERATE_ROUTE_HELP = `${COMPONENTS_MANUAL_TEMPLATES_DIR}/make-route-api_help.stub`;

// commands
exports.CREATE_PROJECT_COMMAND = "create-project";
exports.GENERATE_COMMAND = GENERATE_COMMAND;
exports.GENERATE_CONTROLLER_COMMAND = `${GENERATE_COMMAND}:controller`;
exports.GENERATE_MODEL_COMMAND = `${GENERATE_COMMAND}:model`;
exports.GENERATE_MIGRATION_COMMAND = `${GENERATE_COMMAND}:migration`;
exports.GENERATE_ROUTE_COMMAND = `${GENERATE_COMMAND}:route`;
exports.RUN_MIGRATION_COMMAND = MIGRATE_COMMAND;

exports.MONGOOSE_DATA_TYPES = {
  ARRAY: "array",       //"Array"
  BIGINT: "bigint",     // "BigInt"
  BOOLEAN: "boolean",   // "Boolean"
  BUFFER: "buffer",     // "Buffer"
  DATE: "date",         //"Date"
  DECIMAL: "decimal",   // "Decimal128"
  FLOAT: "float",       // "Decimal128"
  INTEGER: "integer",   //"Number"
  NUMBER: "number",     // "Number"
  MAP: "map",           // "Map"
  MIXED: "mixed",       // "Mixed"
  OBJECTID: "objectid", // "ObjectId"
  SCHEMA: "schema",     // "Schema"
  STRING: "string",     //"String"
  UUID: "uuid",         // "UUID"
};

exports.MIGRATION_TYPES = ["alter-table", "create-table", "update-table", "generic"];

/**
 * DATA TYPES
 */
exports.SEQUELIZE_DATA_TYPES = {
  ARRAY: "array",
  BIGINT: "bigint",
  BLOB: "blob",
  BOOLEAN: "boolean",
  CHAR: "char",
  CIDR: "cidr",
  CITEXT: "citext",
  DATE: "date",
  DATEONLY: "dateonly",
  DECIMAL: "decimal",
  DOUBLE: "double",
  ENUM: "enum",
  FLOAT: "float",
  GEOGRAPHY: "geography",
  GEOMETRY: "geometry",
  HSTORE: "hstore",
  INET: "inet",
  INTEGER: "integer",
  JSON: "json",
  JSONB: "jsonb",
  JSONTYPE: "jsontype",
  MACADDR: "macaddr",
  MEDIUMINT: "mediumint",
  NOW: "now",
  NUMBER: "number",
  RANGE: "range",
  REAL: "real",
  SMALLINT: "smallint",
  STRING: "string",
  TEXT: "text",
  TIME: "time",
  TINYINT: "tinyint",
  UUID: "uuid",
  VIRTUAL: "virtual",
};
