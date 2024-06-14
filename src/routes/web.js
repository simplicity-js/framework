const createCache = require("../middleware/cache");

const cache = createCache({ duration: 0 });


module.exports = function webRouter({ router, download, view }) {

  /*
   * Apply the cache middleware to every router in this group.
   */
  router.group({ middleware: [cache] }, (router) => {

    router.get("/", (req, res) => {
      const config = req.app.resolve("config");
      const appName = config.get("app.name");

      /*
       * Send view variables either via res.locals ...
       */
      res.locals.pageTitle = "Home";
      res.locals.pageTagline = appName;

      /*
       * ... or as via the view variabls options object
       * of the view method
       */
      return view("home", { appName });
    });

  });

  router.get("/download", () => download("home.pug"));

};
