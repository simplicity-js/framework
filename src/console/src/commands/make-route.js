"use strict";

const { GENERATE_ROUTE_COMMAND, GENERATE_ROUTE_HELP } = require(
  "../helpers/constants");
const { print } = require("../helpers/printer");
const { makeRoute } = require("../lib");
const { ensureSimplicityApp, showHelp } = require("./helpers/command-helper");

const PADDING = "  ";

module.exports = {
  name: GENERATE_ROUTE_COMMAND,
  handler: processMakeRouteCommand,
};


async function processMakeRouteCommand(name, cliArgs) {
  let controller;
  let isApiRoute = false;
  let isResourceRoute = false;
  let overwrite = false;
  let displayHelp = false;
  const params = cliArgs || {};

  ensureSimplicityApp(GENERATE_ROUTE_COMMAND);

  const ROUTE_OPTIONS = {
    LIST: ["help", "api", "c", "force", "resource"],
    HELP: "help",
    CONTROLLER_NAME: "c",
    IS_API_ROUTE: "api",
    FORCE: "force",
    IS_RESOURCE_ROUTE: "resource",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = ROUTE_OPTIONS.LIST.includes(o) ? o : "";

    switch(option) {
    case ROUTE_OPTIONS.HELP:
      displayHelp = true;
      showHelp(GENERATE_ROUTE_HELP);
      break;

    case ROUTE_OPTIONS.CONTROLLER_NAME:
      controller = v?.toString();
      break;

    case ROUTE_OPTIONS.IS_API_ROUTE:
      isApiRoute = true;
      break;

    case ROUTE_OPTIONS.IS_RESOURCE_ROUTE:
      isResourceRoute = true;
      break;

    case ROUTE_OPTIONS.FORCE:
      overwrite = true;
      break;

    default:
      // console.log("no options");
      break;
    }
  });

  if(!displayHelp) {
    const suffix = name ? ` '${name}'...` : "...";

    print(`${PADDING}Generating Route${suffix}`);

    return await makeRoute(name, { controller, isApiRoute, isResourceRoute, overwrite,
      isCLI: true,
    });
  }
}
