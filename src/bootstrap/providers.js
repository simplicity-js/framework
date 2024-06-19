/*
 * Import any service providers here
 */
const AppServiceProvider = require("../service-providers/app-service-provider");
const CacheServiceProvider = require("../service-providers/cache-service-provider");
const DatabaseServiceProvider = require("../service-providers/database-service-provider");


/*
 * List the service providers in the order they should be invoked.
 */
module.exports = [
  AppServiceProvider,
  CacheServiceProvider,
  DatabaseServiceProvider,
];
