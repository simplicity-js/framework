const path = require("node:path");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const bootstrap = require("./bootstrap");
const config = require("./config");
const container = require("./framework/container");
const { convertBackSlashToForwardSlash } = require("./framework/lib/string");
const Router = require("./framework/router");
const view = require("./framework/view");

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
 * @param {Function} webRoutes (optional): A function that takes a router instance
 *    and returns web routes.
 * @param {Function} apiRoutes (optional): A function that takes a router instance
 *    and returns API routes.
 * @return {Express}.
 */
module.exports = function createApp({ webRoutes, apiRoutes }) {
  /*
   * Our first action is to bootstrap (aka, register) the services.
   * This way, any registered services are available to route handlers
   * (via req.app.resolve(serviceName)) and other files.
   */
  bootstrap();

  const app = express();

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
  app.use(cors(corsOptions));

  /*
   * Setup Routing
   */
  if(typeof webRoutes === "function") {
    router.group("/", (router) => webRoutes({
      router,
      download: view.downloadFile,
      view: view.viewFile,
    }));
  }

  if(typeof apiRoutes === "function") {
    router.group("/api", (router) => apiRoutes({
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
    const config = req.app.resolve("config");
    const appName = config.get("app.name");
    const environment = req.app.get("env");

    if(environment === "development") {
      res.locals.err = err;
    }

    return view.viewFile("404", {
      appName,
      pageTitle: "Not Found",
      pageTagline: appName,
      status: err.status || 500,
    });
  });

  return app;
};
