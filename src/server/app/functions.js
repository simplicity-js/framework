"use strict";

const EOL = require("node:os").EOL;
const publicIp = () => import("public-ip").then(publicIp => publicIp);
const debug = require("../../lib/debug");

function UCFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const colors = {
  info    : { bg: "\x1b[44m", fg: "\x1b[34m" },
  error   : { bg: "\x1b[41m", fg: "\x1b[31m" },
  warn    : { bg: "\x1b[43m", fg: "\x1b[33m" },
  success : { bg: "\x1b[42m", fg: "\x1b[32m" },
};

const appConsole = Object.entries(colors).reduce((logger, [name, color]) => {
  logger[name] = (msg, ...rest) => (console.log(
    `${EOL}  ${color.bg} ${name.toUpperCase()} \x1b[0m ${msg}`,
    ...rest
  ));

  logger[`${name}Text`] = (msg, ...rest) => (console.log(
    `${EOL}  ${color.fg}${msg}\x1b[0m`,
    ...rest
  ));

  logger[`make${UCFirst(name)}Text`] = (msg) => `${color.fg}${msg}\x1b[0m`;

  return logger;
}, {});

appConsole.log = (...args) => console.log.apply(null, args);


module.exports = {
  normalizePort,
  onError,
  onListening,
  appConsole,
};


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if(error.syscall !== "listen") {
    throw error;
  }

  const bind = parsePort(error.port);

  // handle specific listen errors with friendly messages
  switch (error.code) {
  case "EACCES":
    appConsole.error(`${bind} requires elevated privileges.`);
    process.exit(1);
    break;

  case "EADDRINUSE":
    appConsole.error(`${bind} is already in use.`);
    process.exit(1);
    break;

  default:
    throw error;
  }


  function parsePort(port) {
    return ((typeof port === "string" ? "Pipe ": "Port ") + port);
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(server) {
  var addr = server.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;

  debug("Server Listening on ", bind);

  (async function() {
    let colorer;
    const port = addr.port;
    const environment = process.env.NODE_ENV;

    switch(environment) {
    case "development" : colorer = "WarnText"; break;
    case "staging"     : colorer = "InfoText"; break;
    case "production"  : colorer = "SuccessText"; break;
    default            : colorer = "WarnText"; break;
    }

    let message = "Server running " +
    `[${appConsole[`make${colorer}`](environment)}]:${EOL}` +
    `       Loopback address [http://127.0.0.1:${port}].${EOL}`;

    if(process.env.NODE_ENV !== "test") {
      try {
        const publicAddr = await (await publicIp()).publicIpv4();

        message += `       Public address [http://${publicAddr}:${port}].`;
      } catch {
        message += "";
      }
    }

    appConsole.info(message);
    appConsole.log(`${EOL}  Press Ctrl+C to stop the server.${EOL}`);
  }());
}
