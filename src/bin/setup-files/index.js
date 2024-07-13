const config = require("./config");
const { create } = require("./framework/application");

const port = config.get("app.port");
const app = create();

app.listen(port);
