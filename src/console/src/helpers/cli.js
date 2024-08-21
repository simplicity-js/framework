const cp = require("node:child_process");
const readline = require("node:readline");
const { parseArgs } = require("node:util");

/**
 * Prompt for confirmation on STDOUT/STDIN
 */
exports.confirm = function confirm(msg, defaultAnswer, callback) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  if(typeof defaultAnswer === "function") {
    callback = defaultAnswer;
    defaultAnswer = "No";
  }

  rl.question(msg, function getUserAnswer(input) {
    rl.close();
    callback(/^y|yes|ok|true$/i.test(input || defaultAnswer));
  });
};

exports.confirmPromisified = function confirmPromisified(msg, defaultAnswer) {
  return new Promise((resolve) => confirm(msg, defaultAnswer, resolve));
};

exports.exec = function exec(command, args) {
  return new Promise((resolve, reject) => {
    const ps = cp.spawn(command, args, {
      stdio: "inherit",
      shell: true
    });

    ps.on("close", (code) => {
      if(code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
};

/**
 * Get command line arguments and options
 */
exports.getArgs = function getArgs() {
  const options = parseArgs({
    tokens: true,
    allowPositionals: true,
    options: {
      help      : { type: "boolean", short: "h" },
      fields    : { type: "string",  short: "f" },
      version   : { type: "boolean", short: "v" },
      database  : { type: "string"  },
      migration : { type: "boolean" },
      rollback  : { type: "boolean" },
      step      : { type: "string"  },
      reset     : { type: "boolean" },
      resource  : { type: "boolean" },
      force     : { type: "boolean" },
      api       : { type: "boolean" },
      type      : { type: "string" },
      c         : { type: "string" },
      m         : { type: "string" },
      n         : { type: "string" },
      t         : { type: "string" },
    },
  });

  return options;
};
