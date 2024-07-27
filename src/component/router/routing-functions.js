const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const router = {};


module.exports = {
  createRouter,
  createRoutes,
  createRequestHandler,
};

/**
 * Create router from route definitions in a given directory.
 *
 * @param {String} routeDefinitionsPath: The directory containing route definitions
 * @param {Object} container (optional): A Dependency Injection container.
 *    If supplied, the container is used to resolve controllers.
 *    In that case, ensure the containers are registered to the container.
 *    If the container is not supplied, ensure the controllers are in scope.
 */
function createRouter(routeDefinitionsPath, container) {
  const routesPath = routeDefinitionsPath;
  const routeFiles = fs.readdirSync(routesPath);

  for(let i = 0, len = routeFiles.length; i < len; i++) {
    const filename = path.basename(routeFiles[i], ".js");
    const routeDefinitions = require(`${routesPath}/${filename}`);

    router[filename] = createRoutes(routeDefinitions, container);
  }

  return router;
};

/**
 * Create router from given route definitions
 *
 * @param {Object} routeDefinitions: The route definitions object.
 * The object will contain route definition objects.
 * Each route definition object will have the following members:
 *  - {String} method: The request method
 *  - {String} path: The request path
 *  - {Array} parameters (optional): List of parameter variables in the route
 *  - {Array} middleware (optional): Ordered list of middleware to be applied to the router
 *  - {Array|Function|Object|String} handler: The request handler for the route.
 *       - if Array, it should be in the format: [controller: Class, handler: function]
 *       - if Function, it should be an inline function or the function reference
 *       - if Object, it should be in the format: { controller: controllerRef, method: function}
 *       - if String, it should be in the format: "controller.method"
 *  - {String} description (optional): A description of the route's purpose.
 * @param {Object} container (optional): A Dependency Injection container.
 *    If supplied, the container is used to resolve controllers.
 *    In that case, ensure the containers are registered to the container.
 *    If the container is not supplied, ensure the controllers are in scope.
 * @return {express.Router}
 */
function createRoutes(routeDefinitions, container) {
  const router = express.Router();

  Object.values(routeDefinitions).forEach((rd) => {
    const { method, path, middleware, handler } = rd;
    const requestHandler = createRequestHandler(handler, container);

    router[method.toLowerCase()](path, ...middleware, requestHandler);
  });

  return router;
}

/**
 * Create a request handler
 *
 * @param {Array|Function|Object|String} handler: The request handler for the route.
 *     - if Array, it should be in the format: [controller: Class, handler: function]
 *     - if Function, it should be an inline function or the function reference
 *     - if Object, it should be in the format: { controller: controllerRef, method: function}
 *     - if String, it should be in the format: "controller.method"
 * @param {Object} container (optional): A Dependency Injection container.
 *    If supplied, the container is used to resolve controllers.
 *    In that case, ensure the containers are registered to the container.
 *    If the container is not supplied, ensure the controllers are in scope.
 */
function createRequestHandler(handler, container) {
  let requestHandler;

  if(typeof handler === "function") {
    requestHandler = handler;
  } else if(Array.isArray(handler) && handler.length === 2) {
    const [controller, method] =  handler;

    requestHandler = resolveRequestHandler(controller, method, container);
  } else if(handler && typeof handler === "object" && "controller" in handler && "method" in handler) {
    const { controller, method } = handler;

    requestHandler = resolveRequestHandler(controller, method, container);
  } else if(typeof handler === "string") {
    const [controller, method] = handler.split(/\.|\:\:/).map(s => s.trim());

    requestHandler = resolveRequestHandler(controller, method, container);
  } else {
    throw new TypeError(
      `Invalid handler ${handler} specified for ${method} ${path}.
      The handler should be a function, an array of the form [controller: string, method: string]
      or an object with two properties: controller: string, method: string.
      `
    );
  }

  return requestHandler;
}

/**
 * Resolve a controller handler  (from the container or via require)
 * @param {String|Object} controllerRef: A controller name string or a reference to a controller object.
 *   If this is a string, the corresponding name must have been registered in the DI Container.
 * @param {String|Object} methodRef: A method name string or a reference to a callable.
 *   The method must exist as a member of the controller.
 * @returns {Callable}
 */
function resolveRequestHandler(controllerRef, methodRef, container) {
  let controller;
  let methodName;

  if(container && typeof container.resolve === "function") {
    if(typeof controllerRef === "function" || controllerRef instanceof Function) {
      // We are dealing with a class or constructor function
      controller = container.resolve(controllerRef.name);
    } else if(typeof controllerRef === "string") {
      controller = container.resolve(controllerRef);
    } else {
      controller = controllerRef;
    }
  } else {
    controller = require(controllerRef);
  }

  if(!controller)  {
    throw new TypeError(`Controller ${controllerRef} not found`);
  }

  if(typeof methodRef === "string" && (methodRef in controller)) {
    methodName = methodRef;
  } else if(methodRef.name in controller) {
    methodName = methodRef.name;
  }

  if(!methodName) {
    throw new TypeError(`Method ${String(methodRef)} not found in controller ${controllerRef}`);
  }

  return controller[methodName].bind(controller);
}
