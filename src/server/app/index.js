"use strict";

const createApp = require("./app");
const { appConsole, normalizePort, onError, onListening } = require("./functions");

module.exports = {
  createApp,
  appConsole,
  normalizePort,
  onError,
  onListening,
};
