const os = require("node:os");
const { BUILDER_NAME, FRAMEWORK_NAME } = require("../../helpers/constants");
const { normalizePath, pathExists, readLinesFromFile } = require(
  "../../helpers/file-system");
const { print, marker } = require("../../helpers/printer");
const { throwLibraryError } = require("../../lib");

const EOL = os.EOL;
const PADDING = "  ";

module.exports = {
  ensureSimplicityApp,
  isSimplicityApp,
  showHelp,
  showVersionInfo,
};

function ensureSimplicityApp(command) {
  if(!isSimplicityApp(process.cwd())) {
    throwLibraryError(
      `'${BUILDER_NAME} ${command}' can only be run ` +
      `from a ${FRAMEWORK_NAME} application root directory.`
    );
  }
}

/**
 * Determine if the given directory is a Simplicity application directory.
 */
function isSimplicityApp(projectDir) {
  const packageDotJsonFile = `${normalizePath(projectDir)}/package.json`;

  if(!pathExists(packageDotJsonFile)) {
    return false;
  }

  const pkg = require(packageDotJsonFile);
  const deps = Object.keys(pkg?.dependencies || {});

  if(!deps.includes("@simplicityjs/framework")) {
    return false;
  }

  if(!pathExists(`${projectDir}/src/app/http`)) {
    return false;
  }

  return true;
}

async function showHelp(target) {
  try {
    const lines = await readLinesFromFile(target);
    let output = "";

    for await(const line of lines) {
      output += `${EOL}${PADDING}${line}${EOL}`;
    }

    print(output);
  } catch(e) {
    console.log(e);
  }
}

function showVersionInfo() {
  const cwd = normalizePath(process.cwd());
  let output = "";

  output += `${PADDING}${marker.success.text(FRAMEWORK_NAME)}${` version ${require("../../../package").version} (cli)`}`;

  if(isSimplicityApp(cwd)) {
    output += `${EOL}${PADDING}Framework version ${require(`${cwd}/package`).version}`;
  }

  print(output);
}
