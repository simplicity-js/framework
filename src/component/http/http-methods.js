module.exports = (require("http").METHODS
  .filter(method => method !== "CONNECT")
  .map(method => method.toLowerCase())
);
