"use strict";

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

module.exports = {
  copy,
  createDirectory,
  createFile,
  deleteFileOrDirectory,
  getFilename,
  getFileExtension,
  isDirectory,
  isEmpty,
  listDirectoryContents,
  normalizePath,
  pathExists,
  readFromFile,
  readLinesFromFile,
  writeToFile,
  PATH_SEP: path.sep,
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

/**
 * @param {String} dir: The directory to create.
 *   Supports nested directory structure.
 * @param {Function} ifNotExist (optional):
 *   A function to call the first time the directory is created.
 * @return {Boolean}
 */
function createDirectory(dir, ifNotExist) {
  try {
    !isDirectory(dir) && fs.mkdirSync(dir, { recursive: true });

    if(typeof ifNotExist === "function") {
      ifNotExist();
    }

    return true;
  } catch(err) {
    console.error("Error creating directory: '%s'. Error: %o", dir, err);
    return false;
  }
}

function createFile(filepath) {
  try {
    fs.closeSync(fs.openSync(filepath, "w"));
    return true;
  } catch(err) {
    console.error("Error creating file: '%s'. Error: %o", filepath, err);
    return false;
  }
}

function deleteFileOrDirectory(file) {
  try {
    if(isDirectory(file)) {
      fs.rmSync(file, { recursive: true, force: true });
    } else if(isFile(file)) {
      fs.rmSync(file, { force: true });
    }

    return true;
  } catch(err) {
    console.error("Error deleting file: '%s'. Error: %o", file, err);
    return false;
  }
}

function getFileExtension(file) {
  return isFile(file) ? path.extname(file) : "";
}

function getFilename(file, withExtension) {
  if(withExtension) {
    return path.basename(file);
  } else {
    return path.basename(file, getFileExtension(file));
  }
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

function pathInfo(path) {
  return fs.lstatSync(path);
}

function isEmpty(dir) {
  return listDirectoryContents(dir).length === 0;
}

function listDirectoryContents(dir) {
  return fs.readdirSync(dir);
}

function normalizePath(path) {
  return path.replace(/\\/g, "/");
}

function readFromFile(path, encoding) {
  return fs.readFileSync(path, encoding || "utf8");
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 * @param {Object} options (optional)
 */
function writeToFile(path, str, options) {
  const { encoding = "utf8", flag = "a", mode = 0o666 } = options || {};

  fs.writeFileSync(path, str, { encoding, flag, mode  });
}

/**
 * @param {String} file: The file to read from
 * @param {Object} options (optional): options passed to fs.createReadStream
 */
async function* readLinesFromFile(file, options) {
  const fileStream = await createSafeReadStream(file, options);
  const lineData = readline.createInterface({
    input: fileStream,
    terminal: false,
    crlfDelay: Infinity,
    historySize: 0
  });

  for await(const line of lineData) {
    yield line;
  }


  function createSafeReadStream(filename, options) {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filename, options);

      fileStream.on("error", reject).on("open", () => {
        resolve(fileStream);
      });
    });
  }
}
