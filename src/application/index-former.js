require("./node-version-check");

const path = require("node:path");
const { parseArgs } = require("node:util");
const APP_ROOT = require("../app-root");
const SRC_DIR = `${APP_ROOT}/src`.replace(/\\/g, "/");

const config = require(`${SRC_DIR}/config`);
//const apiRoutes = require(`${SRC_DIR}/routes/api`);
//const webRoutes = require(`${SRC_DIR}/routes/web`);
const serviceProviders = require(`${SRC_DIR}/bootstrap/providers`);

const bootstrap = require("../bootstrap");
const container = require("../component/container");
const { createApp, normalizePort, onError, onListening, appConsole
} = require("../server/app");
const createServer = require("../server/server");
const { pathExists } = require("../component/file-system");
const FrameworkServiceProvider = require(
  "../component/service-provider/framework-service-provider");
const { camelCaseToSnakeCase } = require("../lib/string");

const PROVIDERS_DIR = `${SRC_DIR}/service-providers`;

//const routes = { web: webRoutes, api: apiRoutes };
const providers = serviceProviders.map(function getProvider(provider) {
  if(typeof provider === "string") {
    provider = path.basename(provider, ".js");

    let providerFile;

    if(pathExists(`${PROVIDERS_DIR}/${provider}.js`)) {
      providerFile = provider;
    } else {
      providerFile = camelCaseToSnakeCase(provider, "-");
    }

    if(pathExists(`${PROVIDERS_DIR}/${providerFile}.js`)) {
      provider = require(`${PROVIDERS_DIR}/${providerFile}`);
    }
  }

  return provider;
}).concat([FrameworkServiceProvider]);


module.exports = {
  console: appConsole,
  create() {
    /*
     * Our first action is to bootstrap (aka, register) the services.
     * This way, any registered services are available to route handlers
     * (via req.app.resolve(serviceName)) and other files.
     */
    bootstrap(config, providers);

    /*
     * We are requiring the routes after the call to bootstrap
     * So that controllers would have been registered
     * and usable within the routes
     */
    const routes = {
      api: require(`${SRC_DIR}/routes/api`),
      web: require(`${SRC_DIR}/routes/web`),
    };

    const app = createApp({ config, container, routes });
    const server = createServer({ app, onError, onListening });

    return {
      close(cb) {
        server.close(cb);
      },

      listen(port) {
        const options = parseArgs({
          allowPositionals: true,
          options: {
            port: { type: "string", short: "p" },
          },
        });
        const defaultPort = 8800;
        const listenPort = options.values.port ?? port ?? defaultPort;

        server.listen(normalizePort(listenPort));
      },
    };
  },
};
