const FrameworkServiceProvider = require("../../../../component/service-provider");

class ServiceProvider extends FrameworkServiceProvider {
  #config;

  constructor(config) {
    super(config);
  }
}

module.exports = ServiceProvider;
