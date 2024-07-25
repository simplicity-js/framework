"use strict";

const createRouter = require("node-laravel-router").createRouter;
const { createRequestHandler } = require("./routing-functions");

exports.router = function getAFreshRouterInstance() {
  const router = createRouter();

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

  return router;
};

exports.createRequestHandler = createRequestHandler;
