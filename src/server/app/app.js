const path = require("node:path");
const RedisStore = require("connect-redis").default;
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const createError = require("http-errors");
const { Container } = require("../../component/container");
const maintenanceMode = require("../../component/middleware/maintenance-mode");
const requestLogger = require("../../component/middleware/request-logger");
const session = require("../../component/middleware/session");
const Router = require("../../component/router");
const view = require("../../component/view");
const Connections = require("../../connections");
const is = require("../../lib/is");

const defaultViewTemplatesPath = path.join(
  path.dirname(path.dirname(__dirname)),
  "component", "view", "templates"
);

function copyRouter(srcRouter, destRouter) {
  const { routes = [], routeGroups = [] } = srcRouter;

  //destRouter.routes = [...destRouter.routes, ...routes];

  routes.forEach(({ method, path, handlers }) => {
    destRouter[method].call(destRouter, path, handlers);
  });

  routeGroups.forEach(innerRouter => {
    copyRouter(innerRouter, destRouter);
  });
}

/**
 * @param {Object} options
 * @param {Object} [options.config]: A config object with a get() method
 *    for getting config values.
 * @param {Object} [options.routes]: The routes object
 * @param {Object} [options.routes.web]: web routes (optional):
 *    An object with a "routes" array property, each member of which must have
 *    a method, a path, and a handler stack.
 *    options object and returns web routes.
 * @param {Object} [options.routes.api] api routes (optional):
 *    An object with a "routes" array property, each member of which must have
 *    a method, a path, and a handler stack.
 * @param {Object} [options.container]: An instance of components/container.Container.
 * @return {Object} An Express app instance.
 */
module.exports = function createApp(options) {
  const { appRoot, config, container, routes, appKey } = options || {};
  const { web: webRoutes, api: apiRoutes } = routes || {};

  if(typeof config !== "object" || typeof config.get !== "function") {
    throw new TypeError(
      "createApp 'options' object expects a 'config' object with a 'get' method."
    );
  }

  if(typeof container !== "object" || !(container instanceof Container)) {
    throw new TypeError(
      "createApp 'options' object expects a 'Container' instance."
    );
  }

  if(!is.array(webRoutes?.router?.routes) && !is.array(apiRoutes?.router?.routes)) {
    throw new TypeError(
      "createApp 'options' object expects a 'routes' object " +
      "with either or both of the following members: `web`, `api` " +
      "that must have a 'routes' array member."
    );
  }

  /*
   * Set the default timezone
   */
  process.env.TZ = config.get("app.timezone", "UTC");

  const corsConfig = config.get("cors");
  const allowedOrigins = corsConfig.allowedOrigins;
  const allowAllOrigins = allowedOrigins.includes("*");
  const corsOptions = {
    credentials: corsConfig.credentials,
    methods: corsConfig.allowedMethods,
    allowedHeaders: corsConfig.allowedHeaders,
    origin: function (origin, callback) {
      if(!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };

  const app = express();
  const router = Router.router();

  let sessionStore;

  /*
   * Make the app a DI Container.
   *
   * This enables us to bind (register) and resolve (fetch) dependencies
   * to and from the container from within middleware and route handlers
   * using the app to bind values as follows:
   *   - req.app.bind(key, resolver)
   *   - req.app.instance(key, instance)
   *   - req.app.instantiate(key, className)
   *   - req.app.value(key, value)
   *
   * and to retrieve bound values as follows:
   *   - const value = req.app.resolve(key)
   *
   * ["bind", "instance", "instantiate", "value", "resolve"]
   */
  for(const method of ["bind", "instance", "instantiate", "value", "resolve"]) {
    if(!(method in app)) {
      app[method] = container[method].bind(container);
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
  app.set("views", config.get("view.paths").concat([defaultViewTemplatesPath]));
  app.set("view engine", config.get("view.engine", "pug"));

  /*
   * Makes the basedir available to our template engine so it can resolve absolute paths.
   * This allows us to use 'includes' and 'extends' with absolute paths in pug templates.
   * Otherwise, we'll get error
   * Error: the "basedir" option is required to use includes and extends with "absolute" paths
   */
  app.locals.basedir = app.get("views");

  /*
   * Make the current environment available to template files
   */
  app.locals.environment = config.get("app.environment");

  app.use(requestLogger(app));
  app.use(express.json());
  app.use(view(config));
  app.use(express.static(path.join(appRoot, "src", "public")));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(session(config, sessionStore));
  app.use(cors(corsOptions));

  /*
   * Setup Routing
   */
  router.group(webRoutes.prefix ?? "/", function setupWebRoutes(router) {
    copyRouter(webRoutes.router, router);
  });

  router.group(apiRoutes.prefix ?? "/api", function setupApiRoutes(router) {
    copyRouter(apiRoutes.router, router);
  });

  if(routes.healthCheckRoute) {
    const uri = routes.healthCheckRoute;
    const middleware = require("../../component/middleware/server-status");

    router.get({ uri, middleware }, (req, res) => {
      const config = req.app.resolve("config");
      const { application, server } = res.serverState;
      const { status, uptime, utilization } = server;

      return res.json({
        application: {
          ...application,
          name: config.get("app.name"),
        },
        server: {
          status,
          uptime,
          utilization,
        },
      });
    });
  }

  app.use(maintenanceMode(appKey, config, view.view));

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
