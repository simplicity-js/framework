const APP_ROOT = require("app-root-path");
const SRC_DIR = `${APP_ROOT}/src`.replace(/\\/g, "/");

const { createApp, normalizePort, onError, onListening } = require("./app");
const createServer = require("./server");
const config = require(`${SRC_DIR}/config`);
const apiRouter = require(`${SRC_DIR}/routes/api`);
const webRouter = require(`${SRC_DIR}/routes/web`);
const providers = require(`${SRC_DIR}/bootstrap/providers`);


module.exports = {
  create() {
    const app = createApp({ config, apiRouter, webRouter, providers });
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
