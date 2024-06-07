const createRouter = require("node-laravel-router").createRouter;

class Router {
  constructor() {
    const router = createRouter();

    /*
     * Populate our custom router with non-method members of the router object.
     */
    for(const prop in router) {
      if(Object.hasOwn(router, prop)) {
        this[prop] = router[prop];
      }
    }

    /*
     * Populate our custom router with methods of the router object.
     *
     * Using a for...in loop for(const prop in router) as we did above
     * with either
     * - Object.hasOwnProperty.call(router, prop) or
     * - Object.hasOwn(router, prop)
     * only gets us the router's non-method members
     * because class members are not enumerable.
     *
     * To get the class methods, we have to use Object.getOwnPropertyNames
     *
     */

    const routerMembers = Object.getOwnPropertyNames(Object.getPrototypeOf(router));

    for(const prop of routerMembers) {
      this[prop] = router[prop].bind(router);
    }
  }
}

module.exports = new Router();
