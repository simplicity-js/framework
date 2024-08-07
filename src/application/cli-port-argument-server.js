const path = require("node:path");
const Application = require(".");


module.exports = Application.configure({
  basePath: path.dirname(__dirname) + "/server/test-mocks",
  routing: {
    web: {
      prefix: "/",
      definitions: path.join(path.dirname(__dirname), "server/test-mocks/src/routes", "web"),
    },
    api: {
      prefix: "/api",
      definitions: path.join(path.dirname(__dirname), "server/test-mocks/src/routes", "api"),
    },

    health: "/up",
  },
}).create();
