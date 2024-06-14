const path = require("node:path");
const RedisStore = require("connect-redis").default;
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const bootstrap = require("./bootstrap");
const providers = require("./bootstrap/providers");
const config = require("./config");
const container = require("./framework/component/container");
const Connections = require("./framework/connections");
const { StatusCodes, StatusTexts } = require("./framework/component/http");
const Router = require("./framework/component/router");
const view = require("./framework/component/view");
const { convertBackSlashToForwardSlash } = require("./framework/lib/string");
const session = require("./middleware/session");

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

/**
 * @param {Function} webRouter (optional): A function that takes an
 *    options object and returns web routes.
 * @param {Function} apiRouter (optional): A function that takes an
 *    options object and returns API routes.
 * @return {Object} An Express app instance.
 */
module.exports = function createApp({ webRouter, apiRouter }) {
  if(typeof webRouter !== "function" && typeof apiRouter !== "function") {
    throw new Error(
      "createApp 'options' object expects either or both of " +
      "the following function members: `webRouter`, `apiRouter`."
    );
  }

  /*
   * Our first action is to bootstrap (aka, register) the services.
   * This way, any registered services are available to route handlers
   * (via req.app.resolve(serviceName)) and other files.
   */
  bootstrap(config, providers);

  const app = express();
  const STATUS_CODES = Object.assign(Object.create(null), StatusCodes);
  const STATUS_TEXTS = Object.assign(Object.create(null), StatusTexts);

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
  for(const prop of ["bindWithClass", "bindWithFunction", "resolve"]) {
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
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", config.get("app.viewTemplatesEngine", "pug"));

  app.use(view.init);
  app.use(express.static(convertBackSlashToForwardSlash(path.join(__dirname, "public"))));
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
      STATUS_CODES,
      STATUS_TEXTS,
    }));
  }

  if(typeof apiRouter === "function") {
    router.group("/api", (router) => apiRouter({
      router,
      download: view.downloadFile,
      view: view.viewFile,
      STATUS_CODES,
      STATUS_TEXTS,
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
    const config = req.app.resolve("config");
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
