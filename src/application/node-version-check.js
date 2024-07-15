const semver = require("semver");
const { appConsole } = require("../server/app");
const engines = require("../../package.json").engines;
const version = engines.node;

if(!semver.satisfies(process.version, version)) {
  appConsole.error(
    "SimplicityJS requires Node.js version %s. Installed version: %s",
    version,
    process.version.slice(1) // remove the 'v' in front of the installed version
  );
  process.exit(1);
}
