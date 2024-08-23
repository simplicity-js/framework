const fs = require("node:fs");
const path = require("node:path");
const helpers = require("./helpers/command-helper");

const commands = {};
const otherCommands = {};
const currDir = __dirname;
const commandFiles = fs.readdirSync(currDir);
const filesToSkip = ["helpers", "index"];

for(let i = 0; i < commandFiles.length; i++) {
  const filename = path.basename(commandFiles[i], ".js");

  if(filesToSkip.includes(filename)) {
    continue;
  } else {
    const command = require(`./${filename}`);

    commands[command.name] = command;
  }
}

/**
 * Register a custom command
 *
 * @param {Object} command: object :
 * @param {String} [command.name] (required): The name of the command.
 * @param {String} [command.description] (optional): A description of the command.
 *   This is useful for situations like displaying the general "help" manual.
 * @param {Function} [command.handler] (required): The function to invoke
 *   using the command name. The function is passed
 *   - an array of positional CLI arguments as the first argument
 *   - an object of named CLI arguments as the second argument.
 * @param {Object} [command.options] (optional):
 *   supported command line options (if any). Each options should be in the
 *   format: <optionName>: { type: "boolean"|"string", short: <optionShortVersion> }
 * @param {Boolean} [command.executeOnAppRootOnly] (optional)
 *
 * Example Usage:
 * commands.register({
 *    name: "...",
 *    description: "..."
 *    handler: (list, object) => {...},
 *    executeOnAppRootOnly: false,
 *    options: {
 *       port: { type: "boolean", "short": "p" },
 *       version: { type: "string", "short": "v" },
 *    }
 * })
 */
function register(command) {
  otherCommands[command.name] = command;
}

/**
 * Get list of available commands (core and custom)
 */
function list() {
  return { ...commands, ...otherCommands };
}


module.exports = {
  commands,
  helpers,
  list,
  register,
};
