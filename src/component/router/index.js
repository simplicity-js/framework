"use strict";

const createRouter = require("node-laravel-router").createRouter;
const { wrap } = require("../../lib/object");
const container = require("../container");
const httpMethods = require("../http").METHODS;
const view = require("../view");
const { createRequestHandler } = require("./routing-functions");

exports.router = function getAFreshRouterInstance() {
  let router = createRouter();

  /**
   * Redefine the router.route method so that we are able to
   * automatically resolve controller actions from within it.
   * This gives us greater flexibility in specifying route handlers:
   * { controller: instanceOrClassName, method: methodName }
   * [controllerInstance, methodName]
   * [ControllerClass, methodName]
   * "controllerInstance.methodName",
   * "controllerInstance::methodName"
   * "ControllerClass.methodName",
   * "ControllerClass::methodName"
   */
  wrap(router, "route", function wrapRouter(original, options, action) {
    const resolvedAction = createRequestHandler(action, container);

    return original(options, resolvedAction);
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

  router.match = function matchRoutes(methods, uri, handler) {
    methods.forEach(method => router[method](uri, handler));

    return router;
  };

  router.any = function anyRoute(uri, handler) {
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

  router.view = function viewRoute(uri, template, options) {
    return router.get(uri, () => view.view(template, options));
  };

  return router;
};
