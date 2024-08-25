const fs = require("node:fs");
const path = require("node:path");

const orms = {};
const customOrms = {};
const currDir = __dirname;
const files = fs.readdirSync(currDir);
const filesToSkip = ["helpers", "index"];

for(let i = 0; i < files.length; i++) {
  const filename = path.basename(files[i], ".js");

  if(filesToSkip.includes(filename)) {
    continue;
  } else {
    const orm = require(`./${filename}`);

    orms[orm.name] = orm;
  }
}

/**
 * Register a custom ORM/ODM
 *
 * @param {Object} orm: object :
 * @param {String} [orm.name] (required): The name of the command.
 * @param {String} [orm.description] (optional): A description of the command.
 *   This is useful for situations like displaying the general "help" manual.
 * @param {Function} [orm.createMigration] (required): The function to invoke
 *   for creating the ORM-specific migration (file). The function is passed
 *   - The migration name (a string) as the first argument
 *   - an options object as an optional second argument. The object may contain
 *     any of the following members:
 *       - filename (string): the user's preferred filename for the migration
 *       - table (string): the user's preferred name for the migration table
 *       - type (string): the migration type (create-table|alter-table|update-table)
 *         Note that the user may not specify a type.
 *         It's up to the ORM to then choose what to do in such situations.
 *       - fields (string[]): An array of objects representing the fields
 *         of the migration/model, where each object is composed of
 *         the field name as the key, and the datatype as the value.
 *         The ORM should then parse these fields into its own supported data types.
 * @param {Function} [orm.migrate] (required): The function to invoke to
 *   run the ORM's migrations. The function receives an options object containing
 *   the database (string), step (number, for rollbacks), and reset (boolean) members.
 * @param {Function} [orm.rollback]: (required): The function to invoke to rollback
 *   any previous migration. The function receives an options object containing
 *   the database (string), step (number), and reset (boolean) members.
 * @param {Function} [orm.parseModelFields]: A function for parsing an array of
 *   objects into the ORM's specific fields.
 * @param {Function} [orm.getDatabaseConnection] (required): A function that takes
 *   a database name (or the string 'default') and returns the appropriate database connection.
 *   Useful for connecting to and querying different datastores.
 * @param {Array<String>} [orm.databases] (required): An array of databases supported by the ORM.
 *   This must contain at least one database.
 */
function register(orm) {
  customOrms[orm.name] = orm;
}

function deregister(name) {
  delete customOrms[name];
}

/**
 * Get list of available commands (core and custom)
 */
function list() {
  return { ...orms, ...customOrms };
}


module.exports = {
  list,
  register,
  deregister,
};
