"use strict";

const { MANUAL_HELP } = require("../helpers/constants");
const { showHelp } = require("./helpers/command-helper");

module.exports = {
  name: "help",
  handler: async () => await showHelp(MANUAL_HELP),
};
