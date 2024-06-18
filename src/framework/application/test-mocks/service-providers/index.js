/*
 * Import any service providers here
 */
const AppServiceProvider = require("./app-service-provider");
const CacheServiceProvider = require("./cache-service-provider");


/*
 * List the service providers in the order they should be invoked.
 */
module.exports = [
  AppServiceProvider,
  CacheServiceProvider,
];
