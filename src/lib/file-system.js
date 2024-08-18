"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");


exports.EOL = os.EOL;

exports.deleteDirectory = function deleteDirectory(dir) {
  return fs.rmSync(dir, { recursive: true, force: true });
};

exports.deleteFilesHavingExtension = function deleteFilesHavingExtension(dir, extensions) {
  if(!Array.isArray(extensions) && typeof extensions === "string") {
    extensions = extensions
      .split(/[\s+,;|]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  return new Promise((resolve, reject) => {
    let deletedCounter = 0;
    const targetFiles = [];

    fs.readdir(dir, (err, files) => {
  	  if(err) {
  		  console.log(err);
  	  }

  	  files.forEach((file) => {
  		  const filePath = path.join(dir, file);

        if(extensions.map(ext => ext.toLowerCase()).includes(path.extname(file).toLowerCase())) {
  			  targetFiles.push(filePath);
  		  }
  	  });

      targetFiles.forEach(filePath => {
        try {
          fs.unlinkSync(filePath);
          ++deletedCounter;

          if(deletedCounter === targetFiles.length) {
            resolve();
          }
        } catch(err) {
          reject(err);
        }
      });
    });
  });
};

exports.getCurrentFile = function getCurrentFile() {
  const e = new Error();
  const regex = /\((.*):(\d+):(\d+)\)$/;
  const match = regex.exec(e.stack.split("\n")[2]);

  return {
    file: match[1],
    basename: path.basename(match[1]),
    line: match[2],
    column: match[3],
  };
};

exports.isDirectory = function isDirectory(path) {
  return pathExists(path) && pathInfo(path).isDirectory();
};

exports.isFile = function isFile(path) {
  return pathExists(path) && pathInfo(path).isFile();
};

exports.normalizePath = function normalizePath(path) {
  return path.replace(/\\/g, "/");
};

exports.pathExists = pathExists;

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 * @param {Object} options (optional)
 */
exports.writeToFile = function writeToFile(path, str, options) {
  const { encoding = "utf8", flag = "a", mode = 0o666 } = options || {};

  fs.writeFileSync(path, str, { encoding, flag, mode  });
};

function pathExists(path) {
  return fs.existsSync(path);
}

/**
 * Get object with methods that reveal the stats about a file or directory
 */
function pathInfo(path) {
  return fs.lstatSync(path);
}
