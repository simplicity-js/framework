"use strict";

const { showVersionInfo } = require("./helpers/command-helper");

module.exports = {
  name: "version",
  handler: showVersionInfo,
};
