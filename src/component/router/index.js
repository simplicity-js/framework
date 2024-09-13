"use strict";

const os = require("node:os");
const path = require("node:path");
const createRouter = require("node-laravel-router").createRouter;
const { isFile, writeToFile } = require("../../lib/file-system");
const is = require("../../lib/is");
const { wrap } = require("../../lib/object");
const { hash, isPath } = require("../../lib/string");
const container = require("../container");
const httpMethods = require("../http").METHODS;
const { getViewFilesExtension } = require("../view");
const { createRequestHandler } = require("./routing-functions");

/**
 * Redefine the router so that we are able to
 * automatically resolve controller actions from within it.
 * This gives us greater flexibility in specifying route handlers:
 * { controller: instanceOrClassName, method: methodName }
 * [controllerInstance, methodName] // requires the instance to be in scope (not auto-injected)
 * [ControllerClass, methodName]
 * ["controllerInstance.methodName"]
 * ["ControllerClass.methodName"]
 * ["controllerInstance::methodName"]
 * ["ControllerClass::methodName"]
 * "controllerInstance.methodName",
 * "controllerInstance::methodName"
 * "ControllerClass.methodName",
 * "ControllerClass::methodName"
 */
function normalizeRouterHandlers(router) {
  router.routes.forEach(route => {
    // A route is an object with 'method', 'path', and 'handlers':
    // route.get("/", [handlers])
    for(let i = 0; i < route.handlers.length; i++) {
      let action = route.handlers[i];
      let resolvedAction;

      // Handle cases like:
      //  - route.get("/", [UserCotnroller, 'create']) // Class/Constructor function name
      //  - route.get("/", [userController, 'create']) // Object instance
      // so that they are not seen as two separate middleware.
      const isController = action.name?.match(/^[A-Za-z_$][\w$]+Controller$/);

      if((isController || is.object(action)) && is.string(route.handlers[i + 1])) {
        action = [route.handlers[i], route.handlers[i + 1]];
        resolvedAction = createRequestHandler(action, container);

        route.handlers[i] = resolvedAction;

        // Remove the method part
        // e.g., the 'create' part of the [UserController, 'create']
        route.handlers.splice(i + 1);

        // Alternate method (but registers the same handler twice)
        //route.handlers[i] = route.handlers[i + 1] = resolvedAction;
        // bypass the method part (e.g., 'create') of the Array-like handler.
        //++i;
      } else {
        resolvedAction = createRequestHandler(action, container);
        route.handlers[i] = resolvedAction;
      }
    }
  });

  router.routeGroups.forEach(normalizeRouterHandlers);
}

exports.router = function getAFreshRouterInstance() {
  let router = createRouter();

  /**
   * Redefine the router.route method so that we are able to
   * automatically resolve controller actions from within it.
   * This gives us greater flexibility in specifying route handlers:
   * { controller: instanceOrClassName, method: methodName }
   * [controllerInstance, methodName] // requires the instance to be in scope (not auto-injected)
   * [ControllerClass, methodName]
   * ["controllerInstance.methodName"]
   * ["ControllerClass.methodName"]
   * ["controllerInstance::methodName"]
   * ["ControllerClass::methodName"]
   * "controllerInstance.methodName",
   * "controllerInstance::methodName"
   * "ControllerClass.methodName",
   * "ControllerClass::methodName"
   */
  wrap(router, "route", function wrapRouter(original, options, action) {
    normalizeRouterHandlers(router);

    return original(options, action);
  });

  router.controller = function controllerGroup(controller, closure) {
    closure(new Proxy(router, {
      get(router, method) {
        const handler = function handleRequest(options, action) {
          if(typeof options === "string" || options instanceof String) {
            options = { uri: options };
          }

          options.method = method;
          router.route(options, controller[action]);
        };

        return handler;
      },
    }));

    return router;
  };

  router.middleware = function middlewareGroup(middleware, closure) {
    return router.group({ middleware }, closure);
  };

  router.resource = function resourceGroup(resource, controller, ...rest) {
    if(typeof controller === "function") {
      // we are dealing with a constructor function, a controller class.
      const className = controller.name;
      controller = container.resolve(className);
    }

    return router.group({ prefix: resource, ...rest }, (router) => {
      router.get("/", controller.index);
      router.get("/new", controller.new);
      router.get("/:id", controller.show);
      router.post("/", controller.create);
      router.get("/{id}/edit", controller.edit);
      router.put("/:id", controller.update);
      router.patch("/:id", controller.update);
      router.delete("/:id", controller.destroy);
    });
  };

  router.some = router.match = function matchRoutes(methods, uri, handler) {
    methods.forEach(method => router[method](uri, handler));

    return router;
  };

  router.all = router.any = function anyRoute(uri, handler) {
    return router.match(httpMethods, uri, handler);
  };

  router.redirect = function redirectRoute(fromUri, toUri, statusCode) {
    return router.any(fromUri, (req, res) => {
      return (statusCode
        ? res.redirect(statusCode, toUri)
        : res.redirect(toUri)
      );
    });
  };

  router.permanentRedirect = function permanentRedirectRoute(fromUri, toUri) {
    return router.redirect(fromUri, toUri, 301);
  };

  /**
   * @param {String} uri
   * @param {String} template: either the path to the template file
   *    or a template string.
   */
  router.view = function viewRoute(uri, template, ...rest) {
    if(!isPath(template)) {
      // create a temporary template file from the template string
      let tmpDir;
      let fileExt;

      if(process.env.NODE_ENV === "test") {
        fileExt = "pug";
        tmpDir = __dirname;
      } else {
        fileExt = getViewFilesExtension();
        tmpDir = os.tmpdir();
      }

      const checksum = hash(template, "md5");
      const tmpFilename = `${checksum}.${fileExt}`;
      const tmpFile = path.join(tmpDir, tmpFilename);

      if(!isFile(tmpFile)) {
        writeToFile(tmpFile, template.replace(/\r?\n/g, ""), { flag: "w" });
      }

      template = tmpFile.replace(/\\/g, "/");
    }

    return router.get(uri, (req, res) => res.render(template, ...rest));
  };

  return router;
};
