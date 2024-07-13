"use strict";

const fs = require("node:fs");
const path = require("node:path");

const parentDir = path.resolve(__dirname, "..").replace(/\\/g, "/");
const rootDir   = path.dirname(path.dirname(parentDir));

const TYPE_FILE = "file";
const TYPE_DIR = "directory";
const binDir = `${rootDir}${path.sep}src${path.sep}bin`;

module.exports = {
  copy,
  createDirectory,
  createFile,
  isDirectory,
  isEmpty,
  pathExists,
  TYPE_FILE,
  TYPE_DIR,
  BIN_DIR: binDir,
  PATH_SEP: path.sep,
  ROOT_DIR: rootDir,
};


function copy(src, dest) {
  try {
    if(isDirectory(src)) {
      fs.cpSync(src, dest, { recursive: true });
    } else if(isFile(src)) {
      fs.cpSync(src, dest);
    }

    return true;
  } catch(err) {
    console.log("Failed to copy '%s' to '%s'. Error: %o", src, dest, err);
    return false;
  }
}

function createDirectory(dir) {
  try {
    fs.mkdirSync(dir);
    return true;
  } catch(err) {
    console.error("Error creating directory: '%s'. Error: %o", dir, err);
    return false;
  }
}

function createFile(filepath) {
  try {
    fs.closeSync(fs.openSync(filepath, "w"));
  } catch(err) {
    console.error("Error creating file: '%s'. Error: %o", filepath, err);
    return false;
  }
}

/*function deleteFileOrDirectory(file) {
  try {
    if(isDirectory(file)) {
      fs.rmSync(file, { recursive: true, force: true });
    } else if(isFile(file)) {
      fs.rmSync(file);
    }

    return true;
  } catch(err) {
    console.error("Error deleting file: '%s'. Error: %o", file, err);
    return false;
  }
}*/

/*function getFileExtension(file) {
  return isFile(file) ? path.extname(file) : "";
}*/

/*function getFilename(file, withExtension) {
  if(withExtension) {
    return path.basename(file);
  } else {
    return path.basename(file, getFileExtension(file));
  }
}*/

function isDirectory(path) {
  return pathExists(path) && pathInfo(path).isDirectory();
}

function isFile(path) {
  return pathExists(path) && pathInfo(path).isFile();
}

function pathExists(path) {
  return fs.existsSync(path);
}

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

/*function recreateDirectory(dir) {
  try {
    // First clear the directory if it exists
    // so we don't mistakenly have cached data...
    deleteFileOrDirectory(dir);

    // then recreate it anew...
    createDirectory(dir);
    return true;
  } catch(err) {
    console.error("Failed re-creating directory: '%s'. Error: %o", dir, err);
    return false;
  }
}*/

function isEmpty(dir) {
  return listDirectoryContents(dir).length === 0;
}

function listDirectoryContents(dir) {
  return fs.readdirSync(dir);
}

/**
 * @param {Object} options
 * @param {Function} [options.operation]: a function to be called on each file
 *   read. The function is passed, in order,
 *    - the directory
 *    - the full path to the current file (including the filename)
 *    - the name of the current file (only the filename)
 *   as the first and second arguments respectively.
 * @param {Function} [options.complete]: a function to be called when the directory
 *   has been completely traversed.
 *   The function is passed an error objecct or null as the first argument,
 *   and the list of files read (if any) as the second argument.
 * @param {Regex}: [options.ignore]:
 *   A single pattern or an array of patterns of directories or files to ignore.
 *
 * Cf. https://stackoverflow.com/a/5827895/1743192
 */
/*function traverseDirectory(dir, options) {
  let results = [];
  const { operation, complete, ignore } = options;

  const callback = typeof operation === "function" ? operation : () => {};
  const done = typeof complete === "function" ? complete : () => {};
  const ignorePatterns = ignore ? ignore : /(?!)/; // match nothing: https://stackoverflow.com/a/942122/1743192

  fs.readdir(dir, function(err, list) {
    if(err) {
      return done(err);
    }

    let pending = list.length;

    if(pending === 0) {
      return done(null, results);
    }

    list.forEach(async function(file) {
      file = path.resolve(dir, file).replace(/\\/g, "/");

      if(isDirectory(file) && !exclude(file, ignorePatterns)) {
        traverseDirectory(file, { ignore: ignorePatterns, operation: callback, complete: innerDone});
      } else {
        if(!exclude(file, ignorePatterns)) {
          results.push(file);

          await callback(dir, file, path.basename(file));
        }

        if(!--pending) {
          done(null, results);
        }
      }
    });


    function innerDone(err, res) {
      results = results.concat(res);

      if(!--pending) {
        done(null, results);
      }
    }

    function exclude(file, ignorePatterns) {
      if(Array.isArray(ignorePatterns)) {
        for(let i = 0; i < ignorePatterns.length; i++) {
          const pattern = ignorePatterns[i];

          if(file.match(pattern)) {
            return true;
          }
        }
      } else {
        if(file.match(ignorePatterns)) {
          return true;
        }
      }

      return false;
    }
  });
}*/
