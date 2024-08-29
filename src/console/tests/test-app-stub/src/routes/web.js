const Router = require("@simplicityjs/framework/component/router");

const router = Router.router();

router.get("/", (req, res) => res.send("Home"));

module.exports = router;
