const fs = require("node:fs");
const path = require("node:path");
const eol = require("node:os").EOL;

const currDir = __dirname.replace(/\\/g, "/");
const rootDir = path.dirname(currDir).replace(/\\/g, "/");
const srcDir = `${rootDir}/src`;
const ignoreData = [
  "**/*.spec.js",
  "**/*.test.js",
  "scripts",
  "src/application/cli-port-argument-server.js",
  "src/console/tests",
  "src/validators/tests",
  "src/lib/test-helper.js",
  "src/server/test-mocks",
  "src/test-runner.js",
];

function copy(src, dest) {
  try {
    fs.cpSync(src, dest, { recursive: true });
  } catch(err) {
    console.error("Failed to copy '%s' to '%s'. Error: %o", src, dest, err);
  }
}

function writeFile(path, str, options) {
  const { encoding = "utf8", flag = "a", mode = 0o666 } = options || {};

  fs.writeFileSync(path, str, { encoding, flag, mode  });
}

function prePublish() {
  copy(`${rootDir}/.gitignore`, `${rootDir}/.npmignore`);

  for(const str of ignoreData) {
    writeFile(`${rootDir}/.npmignore`, `${str}${eol}`);
  }
}

if(require.main === "module") {
  prePublish();
}

module.exports = prePublish;
