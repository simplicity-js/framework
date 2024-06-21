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

/**
 * @param {Function} webRouter (optional): A function that takes an
 *    options object and returns web routes.
 * @param {Function} apiRouter (optional): A function that takes an
 *    options object and returns API routes.
 * @return {Object} An Express app instance.
 */
module.exports = function createApp(options) {
  const { config, webRouter, apiRouter, providers } = options || {};

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

  if(typeof webRouter !== "function" && typeof apiRouter !== "function") {
    throw new TypeError(
      "createApp 'options' object expects either or both of " +
      "the following function members: `webRouter`, `apiRouter`."
    );
  }

  /*
   * Set the default timezone
   */
  process.env.TZ = config.get("app.timezone");

  const router = new Router();
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
  //const providers = require(`${config.get("app.rootDir")}/src/bootstrap/providers`);
  bootstrap(config, providers);

  const app = express();

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
  for(const prop of ["bind", "instance", "value", "resolve"]) {
    if(!(prop in app)) {
      app[prop] = container[prop].bind(container);
    }
  }

  if(config.get("session.storageDriver") === "redis") {
    const redisClient = Connections.get("redis", config.get("redis"));
    sessionStore = new RedisStore({ client: redisClient });
  }

  /*
   * Disable the X-Powered-By header
   */
  app.disable("x-powered-by");

  /*
   * View setup
   */
  //app.set("views", path.join(__dirname, "views"));
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
  if(typeof webRouter === "function") {
    router.group("/", (router) => webRouter({
      router,
      download: view.downloadFile,
      view: view.viewFile,
    }));
  }

  if(typeof apiRouter === "function") {
    router.group("/api", (router) => apiRouter({
      router,
      download: view.downloadFile,
      view: view.viewFile,
    }));
  }

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

    return view.viewFile("404", {
      appName,
      pageTitle: "Not Found",
      pageTagline: appName,
      status: statusCode,
    });
  });

  return app;
};
