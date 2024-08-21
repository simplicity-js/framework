const createConfigObject = require("../../../../../config")();

const config = createConfigObject(__dirname, ["config.spec.js", "index.js"]);

module.exports = config;
