"use strict";

const { createPluginInterface } = require("../lib/api-helper");

const { list, register } = createPluginInterface({
  src: __dirname,
  skip: ["request-augmentor", "tests", "validator-helpers", "index"],
});


module.exports = {
  list,
  register,
};
