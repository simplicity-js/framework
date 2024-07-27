const DatabaseFactory = require("@simplicityjs/framework/factory/database");
const ServiceProvider = require("./service-provider");


module.exports = class DatabaseServiceProvider extends ServiceProvider {
  constructor(config) {
    super(config);
  }

  register() {
    const container = this.container();
    const config = this.config() ?? container.resolve("config");
    const dbConfig = config.get("database");
    const driver = dbConfig.default;
    const driverConfig = dbConfig.connections[driver];

    const db = DatabaseFactory.createDatastore(driver, driverConfig);

    /*
     * Bind the default database to the container
     */
    container.bind("db", function createDatastore() {
      return db;
    });
  }
};
