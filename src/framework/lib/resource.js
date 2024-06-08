const path = require("node:path");
const container = require("../container");
const string = require("./string");

module.exports = {
  getResourceDir,
  getViewFilesExtension,
};

function getResourceDir(basePath) {
  const config = container.resolve("config");
  const appDir = config.get("app.rootDir");
  const srcDir = `${appDir}/src`;

  return string.convertBackSlashToForwardSlash(path.join(srcDir, basePath));
}

function getViewFilesExtension() {
  const config = container.resolve("config");

  switch(config.get("app.viewTemplatesEngine")) {
  case "pug": return "pug";
  default: return "pug";
  }
}
