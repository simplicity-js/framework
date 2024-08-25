"use strict";

const { GENERATE_ROUTE_COMMAND, GENERATE_ROUTE_HELP } = require(
  "../helpers/constants");
const { print } = require("../helpers/printer");
const { makeRoute } = require("../lib");
const { showHelp } = require("./helpers/command-helper");

const PADDING = "  ";

module.exports = {
  name: GENERATE_ROUTE_COMMAND,
  handler: processMakeRouteCommand,
  executeOnAppRootOnly: true,
};


/**
 * @param {Array} list: ordered arguments, representing positional CLI arguments
 * @param {Object} options: unordered arguments, representing named CLI options
 */
async function processMakeRouteCommand(list, options) {
  let controller;
  let isApiRoute = false;
  let isResourceRoute = false;
  let overwrite = false;
  let displayHelp = false;

  const name = Array.isArray(list) && !!list.length ? list[0] : "";
  const params = options || {};

  const OPTIONS = {
    HELP: "help",
    IS_API_ROUTE: "api",
    IS_RESOURCE_ROUTE: "resource",
    CONTROLLER_NAME: "controller",
    FORCE: "force",
  };

  Object.entries(params).forEach((entry) => {
    const [o, v] = entry;
    const option = Object.values(OPTIONS).includes(o) ? o : "";

    switch(option) {
    case OPTIONS.HELP:
      displayHelp = true;
      showHelp(GENERATE_ROUTE_HELP);
      break;

    case OPTIONS.CONTROLLER_NAME:
      controller = v?.toString();
      break;

    case OPTIONS.IS_API_ROUTE:
      isApiRoute = true;
      break;

    case OPTIONS.IS_RESOURCE_ROUTE:
      isResourceRoute = true;
      break;

    case OPTIONS.FORCE:
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
