"use strict";

const path = require("node:path");
const { getResourceDir, getViewFilesExtension } = require("../lib/resource");

let localRes;

module.exports = {
  init(req, res, next) {
    if(typeof res.sendFile === "function") {
      localRes = res;
    }

    next();
  },

  /*
   * @param {Any} file: The file to download
   * @param {Object} options (optional):
   * @param {String} [options.basePath] (optional): The directory housing the
   *   file to download, relative to the source directory.
   *   The default is the views (src/views) directory.
   */
  downloadFile(file, options) {
    const res = localRes;
    const { basePath = "views" } = options || {};

    return res.download(file, {
      root: getResourceDir(basePath),
    });
  },

  /*
   * @param {Any} filename: The file to view (with or without the file extension).
   * @param {Object} options (optional):
   * @param {String} [options.basePath] (optional): The directory housing the
   *   file to send to the browser, relative to the source directory.
   *   The default is the views (src/views) directory.
   */
  viewFile(filename, options) {
    const res = localRes;
    const ext = getViewFilesExtension();
    const file = `${path.basename(filename, ext)}.${ext}`;
    const { basePath = "views", ...viewVariables } = options || {};

    return res.render(`${getResourceDir(basePath)}/${file}`, viewVariables);
  },
};
