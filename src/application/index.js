require("./node-version-check");

const path = require("node:path");
const { parseArgs } = require("node:util");

const bootstrap = require("../bootstrap");
const container = require("../component/container");
const { createApp, normalizePort, onError, onListening } = require("../server/app");
const createServer = require("../server/server");
const { pathExists } = require("../component/file-system");
const FrameworkServiceProvider = require(
  "../component/service-provider/framework-service-provider");
const { normalizePath } = require("../lib/file-system");
const { camelCaseToSnakeCase } = require("../lib/string");

module.exports = class Application {
  static #config;
  static #providers;
  static #webRoutes;
  static #apiRoutes;
  static #healthCheckRoute;

  static configure(options) {
    const { basePath, routing } = options;
    const { web: webRoutes, api: apiRoutes, health: healthCheckRoute } = routing;

    const rootDir = normalizePath(basePath);
    const config = require(`${rootDir}/config`);
    const serviceProviders = require(`${rootDir}/bootstrap/providers`);
    const providersDirectory = `${rootDir}/service-providers`;
    const providers = serviceProviders.map(function getProvider(provider) {
      if(typeof provider === "string") {
        provider = path.basename(provider, ".js");

        let providerFile;

        if(pathExists(`${providersDirectory}/${provider}.js`)) {
          providerFile = provider;
        } else {
          providerFile = camelCaseToSnakeCase(provider, "-");
        }

        if(pathExists(`${providersDirectory}/${providerFile}.js`)) {
          provider = require(`${providersDirectory}/${providerFile}`);
        }
      }

      return provider;
    });

    this.#config = config;
    this.#providers = providers;
    this.#webRoutes = webRoutes;
    this.#apiRoutes = apiRoutes;
    this.#healthCheckRoute = healthCheckRoute;

    return this;
  }

  static create() {
    let routes;
    const config = this.#config;
    const webRoutes = this.#webRoutes;
    const apiRoutes = this.#apiRoutes;
    const healthCheckRoute = this.#healthCheckRoute;

    /*
     * Our first action is to bootstrap (aka, register) the services.
     * This way, any registered services are available to route handlers
     * (via req.app.resolve(serviceName)) and other files.
     */
    bootstrap(this.#config, this.#providers.concat([FrameworkServiceProvider]));

    /*
     * We are requiring the routes after the call to bootstrap
     * So that controllers would have been registered
     * and usable within the routes
     */
    routes = {
      web: { ...webRoutes, router: require(webRoutes.definitions) },
      api: { ...apiRoutes, router: require(apiRoutes.definitions) },
      healthCheckRoute,
    };

    const app = createApp({ config, container, routes });
    const server = createServer({ app, onError, onListening });

    class Simplicity {
      stop(cb) {
        server.close(cb);
      }

      listen(port) {
        const options = parseArgs({
          allowPositionals: true,
          options: {
            port: { type: "string", short: "p" },

            // Only included so our test -- --application will not throw errors
            application: { type: "boolean" },
          },
        });
        const defaultPort = 8800;
        const listenPort = (
          port                           // argument passed to `listen(port)`
            ?? options.values.port       // CLI option
            ?? config.get("app.port")    // config (aka process.env.PORT)
            ?? defaultPort               // default port
        );

        server.listen(normalizePort(listenPort));
      }
    }

    return new Simplicity();
  }
};
