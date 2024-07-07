/*
 * Import any service providers here
 */
const AppServiceProvider = require("../service-providers/app-service-provider");
const CacheServiceProvider = require("../service-providers/cache-service-provider");


/*
 * List the service providers in the order they should be invoked.
 */
module.exports = [
  AppServiceProvider,
  CacheServiceProvider,

  /*
   * If your service providers are stored inside the
   * `src/service-providers/` directory,
   * you can avoid importing them and just list them
   * as CamelCase or hyphen-case strings:
   */
  "DatabaseServiceProvider",
  "log-service-provider"
];
