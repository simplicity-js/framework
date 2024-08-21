const path = require("node:path");
const Application = require("../../../../../application");

module.exports = Application.configure({
  basePath: path.dirname(path.dirname(__dirname)),
  routing: {
    web: {
      prefix: "/",
      definitions: path.join(path.dirname(__dirname), "routes", "web"),
    },
    api: {
      prefix: "/api",
      definitions: path.join(path.dirname(__dirname), "routes", "api"),
    },

    health: "/up",
  },
});
