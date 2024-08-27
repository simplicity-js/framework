"use strict";

const path = require("node:path");
const resourcePath = require("../resource-path");

let localRes;
let localConfig;

function getViewFilesExtension(config) {
  switch(config.get("view.engine")) {
  case "jade": return "jade";
  case "pug":
  default: return "pug";
  }
}

module.exports = function(config) {
  localConfig = config;

  return function init(req, res, next) {
    if(typeof res.sendFile === "function") {
      localRes = res;
    }

    next();
  };
};

/*
 * @param {Any} file: The file to download
 * @param {Object} options (optional):
 * @param {String} [options.basePath] (optional): The directory housing the
 *   file to download, relative to the source directory.
 *   The default is the views (src/views) directory.
 */
module.exports.download = function download(file, options) {
  const res = localRes;
  const { basePath = "views" } = options || {};

  return res.download(file, {
    root: resourcePath(basePath),
  });
};

/*
 * @param {String} filename: The file to view (with or without the file extension).
 * @param {Object} options (optional):
 * @param {String} [options.basePath] (optional): The directory housing the
 *   file to send to the browser, relative to the source directory.
 *   The default is the views (src/views) directory.
 */
module.exports.view = function view(filename, options) {
  const res = localRes;
  const ext = getViewFilesExtension(localConfig);
  const file = `${path.basename(filename, ext)}.${ext}`;
  const { templateBase = "views", ...viewVariables } = options || {};
  const viewsDir = resourcePath(templateBase);

  return res.render(`${viewsDir}/${file}`, {
    ...(viewVariables || {}),

    /*
     * Makes the basedir available to our template engine so it can resolve absolute paths.
     * This allows us to use 'includes' and 'extends' with absolute paths in pug templates.
     * Otherwise, we'll get:
     * Error: the "basedir" option is required to use includes and extends with "absolute" paths
     */
    basedir: viewsDir,
  });
};

module.exports.getViewFilesExtension = getViewFilesExtension;
