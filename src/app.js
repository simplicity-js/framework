const path = require("node:path");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const config = require("./config");
const router = require("./framework/router");
const view = require("./framework/view");

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
  const app = express();

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
  app.use(express.static(path.join(__dirname, "public")));
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
    const environment = req.app.get("env");
    const response = {
      error: true,
      message: "The resource you're looking for does not exist",
      code: err.status || 500,
    };

    res.status = response.code;

    if(environment === "development") {
      response.errorStack = err.stack;
    }

    return res.json(response);
  });

  return app;
};
