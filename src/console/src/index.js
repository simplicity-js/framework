#!/usr/bin/env node

"use strict";

const main = require("./cli");
const commands = require("./commands");

if(require.main === module) {
  main();
}

module.exports = require("./lib");
module.exports.dispatch = main;
module.exports.commands = {
  list: commands.list,
  register: commands.register,
};
