const { view, download } = require("../../../../component/view");
const Router = require("../../../../component/router");

const router = Router.router();

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

router.get("/download", () => download("home.pug"));


module.exports = router;
