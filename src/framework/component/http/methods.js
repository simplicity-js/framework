module.exports = {
  buildQueryString,
  getClientInfo,
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
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  };
};
