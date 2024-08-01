"use strict";

const fs = require("node:fs");

exports.isDirectory = function isDirectory(path) {
  return pathExists(path) && pathInfo(path).isDirectory();
};

exports.normalizePath = function normalizePath(path) {
  return path.replace(/\\/g, "/");
};

function pathExists(path) {
  return fs.existsSync(path);
}

function pathInfo(path) {
  return fs.lstatSync(path);
}
