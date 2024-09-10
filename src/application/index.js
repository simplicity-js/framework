"use strict";

require("./node-version-check");

const cp = require("node:child_process");
const path = require("node:path");
const { parseArgs } = require("node:util");
const chokidar = require("chokidar");
const bootstrap = require("../bootstrap");
const getCache = require("../component/cache");
const container = require("../component/container");
const FrameworkServiceProvider = require(
  "../component/service-provider/framework-service-provider");
const commandConsole = require("../console");
const initDotEnv = require("../env").init;
const initResourcePath = require("../resource-path").init;
const initStoragePath = require("../storage-path").init;
const debug = require("../lib/debug");
const { normalizePath, pathExists } = require("../lib/file-system");
const { camelCaseToSnakeCase, hash } = require("../lib/string");
const { appConsole, createApp, normalizePort, onError, onListening
} = require("../server/app");
const createServer = require("../server/server");


module.exports = class Application {
  static #config;
  static #appKey;
  static #appRoot;
  static #providers;
  static #webRoutes;
  static #apiRoutes;
  static #healthCheckRoute;

  static configure(options) {
    debug("Configuring application...");

    const { basePath, routing } = options;
    const { web: webRoutes, api: apiRoutes, health: healthCheckRoute } = routing;

    const rootDir = normalizePath(basePath);

    initDotEnv(rootDir);
    initResourcePath(rootDir);
    initStoragePath(rootDir);

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
    this.#appKey = hash(rootDir.replace(/[\/_:-]+/g, "_"), "md5");
    this.#appRoot = rootDir;
    this.#providers = providers;
    this.#webRoutes = webRoutes;
    this.#apiRoutes = apiRoutes;
    this.#healthCheckRoute = healthCheckRoute;

    debug("Application configuration complete.");

    return this;
  }

  static create() {
    const config = this.#config;
    const appKey = this.#appKey;
    const appRoot = this.#appRoot;
    const providers = this.#providers;
    const webRoutes = this.#webRoutes;
    const apiRoutes = this.#apiRoutes;
    const healthCheckRoute = this.#healthCheckRoute;
    const cacheDriver = config.get("app.maintenance").driver;
    const cache = getCache(cacheDriver, config);
    const testPatchingOptions = {
      // Only included so our tests such as
      // -- --application
      // -- --component.router, etc
      // will not throw errors
      application: { type: "boolean" },
      component: { type: "boolean" },
      "component.router": { type: "boolean" },
    };

    return new class Simplicity {
      #server;

      constructor() {
        debug("Creating application...");

        commandConsole.commands.register({
          name: "start",
          description: "Starts the web server",
          handler: (_, options) => {
            this.#listen(options.port);

            if(process.env.NODE_ENV === "development") {
              this.#watch(options);
            }
          },
          options: {
            port: { type: "string", short: "p" },
            ...testPatchingOptions,
          },
        });

        commandConsole.commands.register({
          name: "down",
          description: "Puts the web server in maintenance mode",
          handler: async (_, options, logger) => {
            const obj = { mode: "maintenance" };

            for(const option of ["refresh", "secret"]) {
              const value = options === "refresh"
                ? Number(options[option])
                : options[option]?.trim();

              if(value) {
                obj[option] = value;
              }
            }

            await cache.set(`${appKey}.state`, obj);

            logger.info("Application is now in maintenance mode.");

            return 0;
          },
          options: {
            refresh: { type: "string" },
            secret: { type: "string" },
          }
        });

        commandConsole.commands.register({
          name: "up",
          description: "Takes the web server out of maintenance mode",
          handler: async (_, $, logger) => {
            await cache.unset(`${appKey}.state`);

            logger.info("Application is now live.");

            return 0;
          },
        });

        commandConsole.commands.register({
          name: "stop",
          description: "Stops the web server",
          handler: () => {
            return new Promise((resolve, reject) => {
              try {
                this.#stop(resolve);
              } catch(e) {
                reject(e);
              }
            });
          }
        });

        const environment = process.env.NODE_ENV;

        if(environment === "test") {
          // So we can test the #listen and #stop methods
          this.listen = this.#listen;
          this.stop = this.#stop;
        }

        debug("Application created.");

        if(process.argv.slice(2)[0] === "start" || environment === "test") {
          // Only boot the server
          // if twe are "dispatching" the "start" "command"
          this.#server = this.#boot();
        }

        debug("Application is ready to use!");
      }

      /**
       * @param {Array<string>} args (optional): array of argument strings.
       *    Default: process.argv with execPath and filename removed.
       *    Same as `config.args` of Node's util.parseArgs.
       *    https://nodejs.org/api/util.html#utilparseargsconfig
       */
      async dispatch(args) {
        return await commandConsole.dispatch(args);
      }

      #boot() {
        debug("Running boot sequence...");

        /*
         * Our first action is to bootstrap (aka, register) the services.
         * This way, any registered services are available to route handlers
         * (via req.app.resolve(serviceName)) and other files.
         */
        bootstrap({
          appRoot,
          config,
          container,
          providers: providers.concat([FrameworkServiceProvider])
        });

        /*
         * We are requiring the routes after the call to bootstrap
         * So that controllers would have been registered
         * and usable within the routes
         */
        const routes = {
          web: { ...webRoutes, router: require(webRoutes.definitions) },
          api: { ...apiRoutes, router: require(apiRoutes.definitions) },
          healthCheckRoute,
        };

        const app = createApp({ appRoot, config, container, routes, appKey });
        const server = createServer({ app, onError, onListening });

        debug("Boot sequence complete.");

        return server;
      }

      #restart(options) {
        this.#stop(() => {
          appConsole.warnText("Change detected. Restarting...");

          cp.spawn(`node ${appRoot}/bob start`, [`--port=${options.port}`], {
            shell: true,
            stdio: "inherit",
          });
        });
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

        this.#server.listen(normalizePort(listenPort));
      }

      #stop(cb) {
        this.#server.close(cb);
      }

      #watch(options) {
        const watcher = chokidar.watch([`${appRoot}/src`,`${appRoot}/.env`], {
          ignored: `${appRoot}/*.spec.js`,
          ignoreInitial: true,
        });

        watcher.on("all", async () => {
          // Guard against registering multiple watchers;
          // Close this watcher. Another will be created on restart.
          await watcher.close();

          this.#restart(options);
        });
      }
    };
  }
};
