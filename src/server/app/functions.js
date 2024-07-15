const os = require("node:os");
const publicIp = () => import("public-ip").then(publicIp => publicIp);
const debug = require("../../lib/debug");

module.exports = {
  normalizePort,
  onError,
  onListening,
};

const EOL = os.EOL;
const COLORS = { info: "\x1b[44m", error: "\x1b[41m", warn: "\x1b[43m" };
const COLOR_TERM = "\x1b[0m"; // color terminator
const logStream = getLogStream("stdout");

function getLogStream() {
  let out;
  let err;

  if(console._stderr?.write) {
    err = console._stderr.write.bind(console._stderr);
  } else {
    err = console.error.bind(console);
  }

  if(console._stdout?.write) {
    out = console._stdout.write.bind(console._stdout);
  } else {
    out = console.log.bind(console);
  }

  return {
    log: out,
    error: err,
  };
}

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
    logStream.error(
      `${EOL}  ${COLORS.error}ERROR${COLOR_TERM} ${bind} ` +
      "requires elevated privileges."
    );

    process.exit(1);
    break;

  case "EADDRINUSE":
    logStream.error(
      `${EOL}  ${COLORS.error}ERROR${COLOR_TERM} ${bind} is already in use.`
    );

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

    try {
      const publicAddr = await (await publicIp()).publicIpv4();

      message += `       Public address [http://${publicAddr}:${port}].${EOL}`;
    } catch {
      message += "";
    }

    logStream.log(`${EOL}  ${COLORS.info}INFO${COLOR_TERM} ${message}`);
    logStream.log(`${EOL}  Press Ctrl+C to stop the server.${EOL}`);
  }());
}
