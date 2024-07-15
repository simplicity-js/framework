require("./node-version-check");

const path = require("node:path");
const APP_ROOT = require("../app-root");
const SRC_DIR = `${APP_ROOT}/src`.replace(/\\/g, "/");

const config = require(`${SRC_DIR}/config`);
const apiRoutes = require(`${SRC_DIR}/routes/api`);
const webRoutes = require(`${SRC_DIR}/routes/web`);
const serviceProviders = require(`${SRC_DIR}/bootstrap/providers`);

const { createApp, normalizePort, onError, onListening, appConsole
} = require("../server/app");
const createServer = require("../server/server");
const { pathExists } = require("../component/file-system");
const { camelCaseToSnakeCase } = require("../lib/string");

const PROVIDERS_DIR = `${SRC_DIR}/service-providers`;

const routes = { web: webRoutes, api: apiRoutes };
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
});


module.exports = {
  console: appConsole,
  create() {
    const app = createApp({ config, routes, providers });
    const server = createServer({ app, onError, onListening });

    return {
      close(cb) {
        server.close(cb);
      },

      listen(port) {
        server.listen(normalizePort(port));
      },
    };
  },
};
