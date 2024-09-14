module.exports = {
  buildQueryString,
  getClientInfo,
  getClientIp,
  getRequestType,
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
}

function getClientIp (req) {
  return (
    req.ip ||
    req._remoteAddress ||
    (req.connection && req.connection.remoteAddress) ||
    undefined
  );
}

function getRequestType(req) {
  let type;
  const contentType = req.get("Content-Type") || "";

  switch(contentType) {
  case "application/javascript":
    type = "javascript";
    break;

  case "application/json":
    type = "json";
    break;

  case "text/plain":
    type = "text";
    break;

  case "application/x-www-form-urlencoded":
    type = "form";
    break;

  default:
    type = "unknown";
  }

  if(contentType.startsWith("multipart/form-data; boundary=")) {
    type = "upload";
  }

  return type;
}
