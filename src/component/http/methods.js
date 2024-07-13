module.exports = {
  buildQueryString,
  getClientInfo,
  getClientIp,
};

function buildQueryString(obj) {
  const strBuilder = [];

  if(typeof obj !== "object" || !obj) {
    return "";
  }

  if(typeof obj === "string" || typeof obj === "number") {
    return obj;
  }

  for (const [prop, value] of Object.entries(obj)) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      strBuilder.push(encodeURIComponent(prop) + "=" + encodeURIComponent(value));
    }
  }

  return strBuilder.join("&");
}

function getClientInfo(req) {
  return {
    ipAddress: getClientIp(req),
    userAgent: req.headers["user-agent"],
  };
};

function getClientIp (req) {
  return (
    req.ip ||
    req._remoteAddress ||
    (req.connection && req.connection.remoteAddress) ||
    undefined
  );
}
