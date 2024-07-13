const http = require("http");
const debug = require("../../lib/debug");

module.exports = function createServer({ app, onError, onListening }) {
  let port;
  const server = http.createServer(app);

  debug("Server created");

  /*
   * Listen on provided port, on all network interfaces.
   */
  //server.listen(port);

  if(typeof onError === "function") {
    server.on("error", (error) => onError(error, port));
  }

  if(typeof onListening === "function") {
    server.on("listening", () => {
      port = server.address().port;

      onListening(server);
    });
  }

  process.on("uncaughtException", function handleUncaughtException(err) {
    console.log("Uncaught Exception: ", require("node:util").inspect(err));

    // Attempt a gracefully shutdown.
    // Then exit
    server.close(() => process.exit(1));

    // If a graceful shutdown is not achieved after 1 second,
    // shut down the process completely
    // exit immediately and generate a core dump file
    setTimeout(() => process.abort(), 1000).unref();
  });

  // Get the unhandled rejection
  // and throw it to the uncaughtException handler.
  process.on("unhandledRejection", function handledPromiseRejection(reason) {
    throw reason;
  });

  return server;
};
