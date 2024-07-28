const getServerInfo = require("../../lib/server-info");

module.exports = function serverStatusMiddleware(req, res, next) {
  res.status(200);
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Expires", "-1");
  res.setHeader("Pragma", "no-cache");

  res.serverState = getServerInfo();

  next();
};
