const FrameworkServiceProvider = require("../framework/component/service-provider");

module.exports = class ServiceProvider extends FrameworkServiceProvider {
  #config;

  constructor(config) {
    super();

    this.#config = config;
  }

  config() {
    return this.#config;
  }
};
