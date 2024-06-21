const createObjectStore = require("../framework/component/registry");
const ServiceProvider = require("./service-provider");


/*
 * Extending the parent `ServiceContainer` gives us access to
 * the DI Container via `this.container()` method.
 */
module.exports = class AppServiceProvider extends ServiceProvider {
  constructor(config) {
    super(config);
  }

  /**
   * Register the service's dependencies in the dependency container.
   */
  register() {
    const container = this.container();
    const config = this.config();

    container.bind("config", function configGetter() {
      return config;
    });

    /*
     * Bind a global registry to the container.
     * This allows the app to manage
     * (insert, retrieve, check existence, and remove) global objects.
     * The main advantage the registry provides over the container
     * is that the registry allows us to insert nested values to global objects
     * without pre-defining the object.
     * For example, using the registry we can do the following:
     *    const registry = container.resolve("registry");
     *    registry.add("my.object.nested.key", value);
     * without first having to do somethig pre-create the my.object.nested like:
     *    const my = { object: { nested: } };
     *    my.object.nested.key = value;
     *
     * Secondly, the registry lets us specify a default value to retrieve
     * when attempting to retrieve a value that may (not) exist in the registry:
     * const value = container.resolve("registry").get(key, defaultValue);
     * If an object has been stored with the `key` key in the registry,
     * value will be that object, otherwise, value will be whatever is passed as
     * defaultValue.
     */
    container.bind("registry", function createRegistry() {
      return createObjectStore();
    });
  }
};
