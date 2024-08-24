require("./node-version-check");

const path = require("node:path");
const { parseArgs } = require("node:util");

const bootstrap = require("../bootstrap");
const container = require("../component/container");
const FrameworkServiceProvider = require(
  "../component/service-provider/framework-service-provider");
const console = require("../console");
const initDotEnv = require("../env").init;
const { normalizePath, pathExists } = require("../lib/file-system");
const { camelCaseToSnakeCase } = require("../lib/string");
const { createApp, normalizePort, onError, onListening } = require("../server/app");
const createServer = require("../server/server");

let applicationInstance;

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

    initDotEnv(rootDir);

    const srcDir = `${rootDir}/src`;
    const config = require(`${srcDir}/config`);
    const serviceProviders = require(`${srcDir}/bootstrap/providers`);
    const providersDirectory = `${srcDir}/service-providers`;
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
    const testPatchingOptions = {
      // Only included so our tests such as
      // -- --application
      // -- --component.router, etc
      // will not throw errors
      application: { type: "boolean" },
      component: { type: "boolean" },
      "component.router": { type: "boolean" },
    };

    // if we already have an instance of the application,
    // return it rather than recreating a new instance.
    if(applicationInstance) {
      return applicationInstance;
    }

    /*
     * Our first action is to initialize environment variables,
     * then bootstrap (aka, register) the services.
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

    return new class Simplicity {
      constructor() {
        console.commands.register({
          name: "start",
          description: "Starts the web server",
          handler: (_, options) => this.#listen(options.port),
          options: {
            port: { type: "string", short: "p" },
            ...testPatchingOptions,
          },
        });

        console.commands.register({
          name: "stop",
          description: "Stops the web server",
          handler: () => {
            return new Promise((resolve, reject) => {
              try {
                this.#stop(resolve);
              } catch(e) {
                reject(e.code);
              }
            });
          }
        });

        if(process.env.NODE_ENV === "test") {
          // So we can test the #listen and #stop methods
          this.listen = this.#listen;
          this.stop = this.#stop;
        }

        applicationInstance = this;
      }

      /**
       * @param {Array<string>} args (optional): array of argument strings.
       *    Default: process.argv with execPath and filename removed.
       *    Same as `config.args` of Node's util.parseArgs.
       *    https://nodejs.org/api/util.html#utilparseargsconfig
       */
      async dispatch(args) {
        return await console.dispatch(args);
      }

      #stop(cb) {
        server.close(cb);
      }

      #listen(port) {
        const options = parseArgs({
          allowPositionals: true,
          options: {
            port: { type: "string", short: "p" },
            ...testPatchingOptions,
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
    };
  }
};
