const path = require("node:path");
const RedisStore = require("connect-redis").default;
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const bootstrap = require("../../bootstrap");
const container = require("../../component/container");
const Connections = require("../../connections");
const Router = require("../../component/router");
const view = require("../../component/view");
const requestLogger = require("../../component/middleware/request-logger");
const session = require("../../component/middleware/session");
const is = require("../../lib/is");

function copyRouter(srcRouter, destRouter) {
  const { routes = [], routeGroups = [] } = srcRouter;

  routes.forEach(({ method, path, handlers }) => {
    destRouter[method].call(destRouter, path, handlers);
  });

  routeGroups.forEach(innerRouter => {
    copyRouter(innerRouter, destRouter);
  });
}

/**
 * @param {Object} config: A config object with a get() method
 *    for getting config values.
 * @param {Object} routes: The routes object
 * @param {Object} [routes.web]: web routes (optional):
 *    An object with a "routes" array property, each member of which must have
 *    a method, a path, and a handler stack.
 *    options object and returns web routes.
 * @param {Object} [routes.api] api routes (optional):
 *    An object with a "routes" array property, each member of which must have
 *    a method, a path, and a handler stack.
 * @return {Object} An Express app instance.
 */
module.exports = function createApp(options) {
  const { config, routes, providers } = options || {};
  const { web: webRoutes, api: apiRoutes } = routes || {};

  if(typeof config !== "object" || typeof config.get !== "function") {
    throw new TypeError(
      "createApp 'options' object expects a 'config' object with a 'get' method."
    );
  }

  if(!Array.isArray(providers)) {
    throw new TypeError(
      "createApp 'options' object expects a 'providers' array."
    );
  }

  if(!is.array(webRoutes?.routes) && !is.array(apiRoutes?.routes)) {
    throw new TypeError(
      "createApp 'options' object expects a 'routes' object " +
      "with either or both of the following members: `web`, `api` " +
      "that must have a 'routes' array member."
    );
  }

  /*
   * Set the default timezone
   */
  process.env.TZ = config.get("app.timezone");

  const allowedOrigins  = config.get("app.allowedOrigins");
  const allowAllOrigins = allowedOrigins.includes("*");
  const corsOptions = {
    origin: function (origin, callback) {
      if(!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: config.get("app.allowedMethods"),
    allowedHeaders: config.get("app.allowedHeaders"),
  };

  /*
   * Our first action is to bootstrap (aka, register) the services.
   * This way, any registered services are available to route handlers
   * (via req.app.resolve(serviceName)) and other files.
   */
  bootstrap(config, providers);

  const app = express();
  const router = Router.router();

  let sessionStore;

  /*
   * Make the app a DI Container.
   *
   * This enables us to bind (register) and resolve (fetch) dependencies
   * to and from the container from within middleware and route handlers
   * using the app as follows:
   *   - req.app.bindWithClass(dependencyKey, implementationClass, constructorParams)
   *   - req.app.bindWithFunction(dependencyKey, implementationFunction, params)
   *   - const value = req.app.resolve(dependencyKey)
   */
  for(const prop of ["bind", "instance", "instantiate", "value", "resolve"]) {
    if(!(prop in app)) {
      app[prop] = container[prop].bind(container);
    }
  }

  if(config.get("session.storageDriver") === "redis") {
    const redisClient = Connections.get("redis", config.get("redis"));
    sessionStore = new RedisStore({ client: redisClient });
  }

  app.enable("trust proxy");

  /*
   * Disable the X-Powered-By header
   */
  app.disable("x-powered-by");

  /*
   * View setup
   */
  app.set("views", config.get("app.viewsDir"));
  app.set("view engine", config.get("app.viewTemplatesEngine", "pug"));

  app.use(requestLogger(app));
  app.use(express.json());
  app.use(view.init);
  app.use(express.static(path.join(config.get("app.srcDir"), "public")));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(session(config, sessionStore));
  app.use(cors(corsOptions));

  /*
   * Setup Routing
   */
  router.group("/", function setupWebRoutes(router) {
    copyRouter(webRoutes, router);
  });

  router.group("/api", function setupApiRoutes(router) {
    copyRouter(apiRoutes, router);
  });

  /*
   * Apply the routing
   */
  router.apply(({ method, path, handlers }) => app[method](path, handlers));

  /*
   * catch 404 and forward to "catch-all" route handler
   */
  app.use((req, res, next) => next(createError(404)));

  /*
   * "catch-all" route handler
   */
  // eslint-disable-next-line
  app.use((err, req, res, next) => {
    const appName = config.get("app.name");
    const environment = req.app.get("env");
    const statusCode = err.status || 500;

    if(["development", "test"].includes(environment)) {
      res.locals.err = err;
    }

    res.status(statusCode);

    return view.view("404", {
      appName,
      pageTitle: "Not Found",
      pageTagline: appName,
      status: statusCode,
    });
  });

  return app;
};
