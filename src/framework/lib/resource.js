const path = require("node:path");
const mime = require("mime-types");
const container = require("../container");
const string = require("./string");

module.exports = {
  getMimeType,
  getResourceDir,
  getViewFileExtension,
};


function getMimeType(file) {
  let type = mime.lookup(file);

  if(!type) {
    const extension = path.extname(file)?.substring(1)?.toLowerCase();

    switch(extension) {
    case "jade" :
    case "pug"  : return "text/html";
    default     : return type;
    }
  }
}

function getResourceDir(basePath) {
  const config = container.resolve("config");
  const appDir = config.get("app.rootDir");
  const srcDir = `${appDir}/src`;

  return string.convertBackSlashToForwardSlash(path.join(srcDir, basePath));
}

function getViewFileExtension() {
  const config = container.resolve("config");

  switch(config.get("app.viewTemplatesEngine")) {
  case "pug": return "pug";
  default: return "pug";
  }
}
