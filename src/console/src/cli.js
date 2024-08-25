#!/usr/bin/env node

"use strict";

require("./node-version-check");

const { parseArgs } = require("node:util");
const { helpers, list: getAvailableCommands, register: registerCommand
} = require("./commands");
const { print } = require("./helpers/printer");
const { BUILDER_NAME, GENERATE_COMMAND, GENERATE_HELP, MANUAL_HELP
} = require("./helpers/constants");
const { printErrorMessage } = require("./lib");

const PADDING = "  ";
const { ensureSimplicityApp, showHelp, showVersionInfo } = helpers;
const coreCliOptions = {
  help      : { type: "boolean", short: "h" },
  fields    : { type: "string",  short: "f" },
  table     : { type: "string",  short: "t" },
  version   : { type: "boolean", short: "v" },
  attributes: { type: "string"  },
  database  : { type: "string"  },
  migration : { type: "boolean" },
  rollback  : { type: "boolean" },
  step      : { type: "string"  },
  reset     : { type: "boolean" },
  resource  : { type: "boolean" },
  force     : { type: "boolean" },
  api       : { type: "boolean" },
  type      : { type: "string" },
  c         : { type: "string" },
  m         : { type: "string" },
  n         : { type: "string" },
};
const customCliOptions = {};

for(const command of [GENERATE_COMMAND, `${GENERATE_COMMAND}:`]) {
  registerCommand({ name: command, handler: () => showHelp(GENERATE_HELP) });
}

/**
 * Get command line arguments and options
 *
 * @param {String[]} args (optional): array of argument strings.
 *    Default: process.argv with execPath and filename removed.
 *    Same as `config.args` of Node's util.parseArgs.
 *    https://nodejs.org/api/util.html#utilparseargsconfig
 */
function getConsoleArgs(args) {
  const config = {
    tokens: true,
    allowPositionals: true,
    options: { ...coreCliOptions, ...customCliOptions },
  };

  if(Array.isArray(args) && args.every(arg => typeof arg === "string")) {
    config.args = args;
  }

  const options = parseArgs(config);

  return options;
}

/**
 * @param {String[]} args (optional): array of argument strings.
 *    Default: process.argv with execPath and filename removed.
 *    Same as `config.args` of Node's util.parseArgs.
 *    https://nodejs.org/api/util.html#utilparseargsconfig
 */
async function main(args) {
  const availableCommands = getAvailableCommands();
  const commandList = Object.keys(availableCommands);

  commandList.forEach(function registerCommandOptions(name) {
    const command = availableCommands[name];

    if(typeof command.options === "object" && command.options) {
      for(const prop in command.options) {
        customCliOptions[prop] = command.options[prop];
      }
    }
  });

  const { positionals: list, values: options } = getConsoleArgs(args);
  const c = list[0];

  try {
    if(commandList.includes(c)) {
      const command = availableCommands[c];

      if(command.executeOnAppRootOnly) {
        ensureSimplicityApp(command.name);
      }

      return await command.handler(list.slice(1), options);
    } else if(c) {
      print(
        `${PADDING}ERROR: Unkown Command '${c}' ` +
        `pls type ${BUILDER_NAME} --help for help.`
      );
    } else if(options.version) {
      return showVersionInfo();
    } else {
      return showHelp(MANUAL_HELP);
    }
  } catch(err) {
    printErrorMessage(err);
    return err.code ?? 1;
  }
}

if(require.main === module) {
  // Majorly for testing purposes (cli.spec.js)
  main();
}

module.exports = main;
