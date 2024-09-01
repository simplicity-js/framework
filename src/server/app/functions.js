const EOL = require("node:os").EOL;
const publicIp = () => import("public-ip").then(publicIp => publicIp);
const debug = require("../../lib/debug");

const colors = {
  info    : "\x1b[44m",
  error   : "\x1b[41m",
  warn    : "\x1b[43m",
  success :  "\x1b[42m"
};

const appConsole = Object.entries(colors).reduce((logger, [name, color]) => {
  logger[name] = (msg, ...rest) => (console.log(
    `${EOL}  ${color} ${name.toUpperCase()} \x1b[0m ${msg}`,
    ...rest
  ));

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
    const port = addr.port;
    let message = `Server running: ${EOL}` +
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
