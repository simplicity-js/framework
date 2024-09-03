const fs = require("node:fs");
const path = require("node:path");

const currDir = __dirname.replace(/\\/g, "/");
const rootDir = path.dirname(currDir).replace(/\\/g, "/");
const srcDir = `${rootDir}/src`;

function deleteFile(file) {
  try {
    fs.rmSync(file, { force: true });
  } catch(err) {
    console.error("Error deleting file: '%s'. Error: %o", file, err);
  }
}

function postPublish() {
  deleteFile(`${rootDir}/.npmignore`);
}

if(require.main === "module") {
  postPublish();
}

module.exports = postPublish;
