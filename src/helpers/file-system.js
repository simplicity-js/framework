const fs = require("node:fs");

module.exports = {
  isDirectory,
  isFile,
};

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
