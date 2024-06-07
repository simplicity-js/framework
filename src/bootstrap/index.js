const providers = require("./providers");

module.exports = function setupServices() {
  for(let i = 0; i < providers.length; i++) {
    const Provider = providers[i];
    const provider = new Provider();

    /*
     * Bind the dependencies of the service(s) that the provider provides
     * to the service container.
     */
    provider.register();
  }
};
