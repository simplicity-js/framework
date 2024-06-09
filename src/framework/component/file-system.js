"use strict";

const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  getCurrentFile,
  isDirectory,
  isFile,
};

function getCurrentFile() {
  const e = new Error();
  const regex = /\((.*):(\d+):(\d+)\)$/;
  const match = regex.exec(e.stack.split("\n")[2]);

  return {
    file: match[1],
    basename: path.basename(match[1]),
    line: match[2],
    column: match[3],
  };
}

function isDirectory(path) {
  return pathExists(path) && pathInfo(path).isDirectory();
}

function isFile(path) {
  return pathExists(path) && pathInfo(path).isFile();
}

function pathExists(path) {
  return fs.existsSync(path);
}

/**
 * Get object with methods that reveal the stats about a file or directory
 */
function pathInfo(path) {
  /* https://stackoverflow.com/a/15630832/1743192
  const stats = fs.lstatSync(path);
  stats.isFile()
  stats.isDirectory()
  stats.isBlockDevice()
  stats.isCharacterDevice()
  stats.isSymbolicLink() // (only valid with fs.lstat())
  stats.isFIFO()
  stats.isSocket()
  */
  return fs.lstatSync(path);
}
