const fs = require("node:fs");
const path = require("node:path");
const helpers = require("./helpers/command-helper");

const commands = {};
const currDir = __dirname;
const commandFiles = fs.readdirSync(currDir);
const filesToSkip = ["helpers", "index"];

for(let i = 0; i < commandFiles.length; i++) {
  const filename = path.basename(commandFiles[i], ".js");

  if(filesToSkip.includes(filename)) {
    continue;
  } else {
    const { name, handler } = require(`./${filename}`);

    commands[name] = handler;
  }
}


module.exports = {
  commands,
  helpers,
};
