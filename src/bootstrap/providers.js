/*
 * Import any service providers here
 */
const AppServiceProvider = require("../service-providers/app-service-provider");


/*
 * List the service providers in the order they should be invoked.
 */
module.exports = [
  AppServiceProvider,
];
