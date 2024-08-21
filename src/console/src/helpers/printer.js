"use strict";

const colors = {
  info    : { bg: "\x1b[44m", fg: "\x1b[34m" },
  error   : { bg: "\x1b[41m", fg: "\x1b[31m" },
  warn    : { bg: "\x1b[43m", fg: "\x1b[33m" },
  success : { bg: "\x1b[42m", fg: "\x1b[32m" },
};

const marker = Object.keys(colors).reduce((marker, type) => {
  const { bg, fg } = colors[type];

  marker[type] = {
    text: (msg) => `${fg}${msg}\x1b[0m`,
    background: (msg) => `${bg}${msg}\x1b[0m`
  };

  return marker;
}, {});

const print = (message, ...rest) => console.log(message ?? "", ...rest);


exports.marker = marker;
exports.print = print;
