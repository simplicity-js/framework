const http = require("http");
const createApp = require("./app");
const config = require("./config");
const debug = require("./framework/lib/debug");
const webRouter = require("./routes/web");
const apiRouter = require("./routes/api");

const port = normalizePort(config.get("app.port"));

/*
 * Set the default timezone
 */
process.env.TZ = config.get("app.timezone");


function startServer({ port, onError, onListening }) {
  const app = createApp({ webRouter, apiRouter });
  const server = http.createServer(app);

  // Listen on provided port, on all network interfaces.
  server.listen(port);

  if(typeof onError === "function") {
    server.on("error", (error) => onError(error, port));
  }

  if(typeof onListening === "function") {
    server.on("listening", () => onListening(server));
  }

  // Get the unhandled rejection
  // and throw it to the uncaughtException handler.
  process.on("unhandledRejection", function handledPromiseRejection(reason) {
    throw reason;
  });

  process.on("uncaughtException", function handleUncaughtException(/*err*/) {
    // Attempt a gracefully shutdown.
    // Then exit
    server.close(() => process.exit(1));

    // If a graceful shutdown is not achieved after 1 second,
    // shut down the process completely
    // exit immediately and generate a core dump file
    setTimeout(() => process.abort(), 1000).unref();
  });
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error, port) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string"
    ? "Pipe " + port
    : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
  case "EACCES":
    console.error(bind + " requires elevated privileges");
    process.exit(1);
    break;
  case "EADDRINUSE":
    console.error(bind + " is already in use");
    process.exit(1);
    break;
  default:
    throw error;
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
  debug("Listening on " + bind);
  console.log("Server listening on ", bind);
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


if(require.main === module) {
  startServer({ port, onError, onListening });
}

module.exports = {
  start: startServer,
};
