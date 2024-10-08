const debug = require("../lib/debug");


module.exports = function setupServices(options) {
  const { appRoot, config, container, providers } = options || {};

  for(let i = 0; i < providers.length; i++) {
    const Provider = providers[i];

    if(typeof Provider !== "function") {
      throw new TypeError(
        "A Service Provider must be a class or constructor function. " +
        `Service Provider ${Provider} is a ${typeof Provider}.`
      );
    }

    const provider = new Provider({ appRoot, config, container });
    const className = Object.getPrototypeOf(provider)?.name ?? Provider.name;

    if(typeof provider.register !== "function") {
      throw new TypeError(
        "Service providers must define a 'register()' method. " +
        `Service Provider '${className}' has no 'register()' method defined.`
      );
    }

    debug(`Registering provider '${className}'`);

    /*
     * Bind the dependencies of the service(s) that the provider provides
     * to the service container.
     */
    provider.register();

    debug(`Provider '${className}' registration complete.`);
  }
};
