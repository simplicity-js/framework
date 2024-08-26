const apiHelper = require("../../../lib/api-helper");

module.exports = apiHelper.createPluginInterface({
  src: __dirname,
  skip: ["helpers", "index"],
});
