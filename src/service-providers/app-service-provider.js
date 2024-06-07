const config = require("../config");
const ServiceProvider = require("../framework/service-provider");


/*
 * Extending the parent `ServiceContainer` gives us access to
 * the DI Container via `this.container()` method.
 */
class AppServiceProvider extends ServiceProvider {
  constructor() {
    super();
  }

  /**
   * Register the service's dependencies in the dependency container.
   */
  register() {
    this.container().bindWithFunction("config", function configGetter() {
      return config;
    });
  }
}

module.exports = AppServiceProvider;
