const apiHelper = require("../../../lib/api-helper");
const helpers = require("./helpers/command-helper");

const { list, register } = apiHelper.createPluginInterface({
  src: __dirname,
  skip: ["helpers", "index"],
});


module.exports = {
  helpers,
  list,
  register,
};
