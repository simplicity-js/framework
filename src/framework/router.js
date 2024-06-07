const createRouter = require("node-laravel-router").createRouter;
const { copyMembers } = require("./lib/object");

class Router {
  constructor() {
    copyMembers(createRouter(), this, { overwrite: true, bindSource: true });
  }
}

module.exports = new Router();
