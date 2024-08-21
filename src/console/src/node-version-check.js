"use strict";

const semver = require("semver");
const engines = require("../package.json").engines;
const { print, marker } = require("./helpers/printer");

const version = engines.node;

if(!semver.satisfies(process.version, version)) {
  const color = marker.error;

  print(
    `${color.background("ERROR")} ` +
    `${color.text(
      "SimplicityJS requires Node.js version %s. Installed version: %s"
    )}`,
    version,
    process.version.slice(1) // remove the 'v' in front of the installed version
  );

  process.exit(1);
}
