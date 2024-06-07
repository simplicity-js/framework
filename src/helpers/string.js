const BACKSLASH_REGEX = /\\/g;

module.exports = {
  convertBackSlashToForwardSlash,
};

function convertBackSlashToForwardSlash(str) {
  return str.replace(BACKSLASH_REGEX, "/");
}
