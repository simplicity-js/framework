#!/usr/bin/env node

"use strict";

const main = require("./cli");
const commands = require("./commands");

if(require.main === module) {
  main();
}

module.exports = require("./lib");
module.exports.dispatch = main;

// I imported and exported this here as part of the console interface
// because the commands are logically part of the console. For example, we do:
// console.dispatch(<command>).
// But I exported (will export) the ORMs in the package.json file because we might
// want to someday separate out the orms directory from the console directory.
// Not binding the ORM to the console makes that easier. We can do the separation
// without affecting any other parts of our code or causing breaking change
// issues for framework users.
module.exports.commands = {
  list: commands.list,
  register: commands.register,
};
