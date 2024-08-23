#!/usr/bin/env node

"use strict";

require("./node-version-check");

const { commands, helpers } = require("./commands");
const { getArgs } = require("./helpers/cli");
const { print } = require("./helpers/printer");
const { GENERATE_COMMAND, GENERATE_HELP, MANUAL_HELP } = require(
  "./helpers/constants");
const { printErrorMessage } = require("./lib");

const { ensureSimplicityApp, showHelp, showVersionInfo } = helpers;

const { values: params, positionals: list } = getArgs();
const PARAMETER_1 = list[0];
const PARAMETER_2 = list[1];
const PADDING = "  ";

const otherCommands = {};

for(const command of [GENERATE_COMMAND, `${GENERATE_COMMAND}:`]) {
  registerCommand({ name: command, handler: () => showHelp(GENERATE_HELP) });
}

function registerCommand(command) {
  otherCommands[command.name] = command.handler;
}

function getAvailableCommands() {
  return { ...commands, ...otherCommands };
}


async function main(c) {
  const availableCommands = getAvailableCommands();
  const commandList = Object.keys(availableCommands);

  try {
    if(commandList.includes(c)) {
      const command = availableCommands[c];

      if(command.executeOnAppRootOnly) {
        ensureSimplicityApp(command.name);
      }

      return await command.handler(PARAMETER_2, params);
    } else if(c) {
      print(
        `${PADDING}ERROR: Unkown Command '${c}' ` +
        `pls type ${BUILDER_NAME} --help for help.`
      );
    } else if(params.version) {
      return showVersionInfo();
    } else {
      return showHelp(MANUAL_HELP);
    }
  } catch(err) {
    printErrorMessage(err);
    return err.code ?? 1;
  }
}

/**
 *  Start of main
 */
main(PARAMETER_1);
