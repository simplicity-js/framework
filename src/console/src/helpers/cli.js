const cp = require("node:child_process");
const readline = require("node:readline");

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
