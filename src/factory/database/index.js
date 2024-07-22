const is = require("../../lib/is");
const createDocumentStore = require("./mongoose");
const createSqlStore = require("./sequelize");

const supportedDbTypes = ["mongodb", "mariadb", "memory", "mysql", "postgres", "sqlite"];

module.exports = class DatabaseFactory {
  /**
   * @param {String} driver: the type of database to get.
   *   Supported drivers include
   *     "mongodb", "mariadb", "memory", "mysql", "postgres", "sqlite".
   * @param {Object} config: the configuration for the specified database type driver.
   * @param {String} [config.orm]: The ODM/ORM library to use.
   *    Supported ODM/ORM libraries are "mongoose" and "sequelize" (default).
   * @return {Object}
   */
  static async createDatastore(driver, config) {
    let datastoreCreationFn;
    const errorPrefix = "DatabaseFactory::createDatastore(driver, config): ";

    driver = String(driver).toLowerCase();

    if(!supportedDbTypes.includes(driver)) {
      throw new TypeError(
        errorPrefix +
        "Invalid `driver` parameter. " +
        `Supported drivers include ${supportedDbTypes.join(", ")}`
      );
    }

    if(!config || !is.object(config)) {
      throw new TypeError(
        errorPrefix +
        "The `config` parameter expects an object."
      );
    }

    if(driver === "mongodb" && config.orm?.toLowerCase() === "mongoose") {
      datastoreCreationFn = createDocumentStore;
    } else {
      datastoreCreationFn = createSqlStore;
    }

    /*switch(driver) {
    case "mariadb"  :
    case "memory"   :
    case "mysql"    :
    case "postgres" :
    case "sqlite"   : datastoreCreationFn = createSqlStore;
      break;

    case "mongodb" :
    default        : datastoreCreationFn = createDocumentStore;
      break;
    }*/

    const store = await datastoreCreationFn(config);

    return store;
  }
};
