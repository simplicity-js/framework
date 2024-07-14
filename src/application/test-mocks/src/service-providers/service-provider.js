const FrameworkServiceProvider = require("../../../../component/service-provider");

class ServiceProvider extends FrameworkServiceProvider {
  #config;

  constructor(config) {
    super();

    this.#config = config;
  }

  config() {
    return this.#config;
  }
}

module.exports = ServiceProvider;
