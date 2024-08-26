const apiHelper = require("../../../lib/api-helper");
const helpers = require("./helpers/command-helper");

const { list, register } = apiHelper.createPluginInterface(
  __dirname,
  ["helpers", "index"]
);


module.exports = {
  helpers,
  list,
  register,
};
