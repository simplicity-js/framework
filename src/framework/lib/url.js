const { stripFirstNCharsFromString, stripLastNCharsFromString } = require("./string");

module.exports = {
  getValidUrl,
  normalizeUrlPath,
};


function getValidUrl(baseUrl, path, apiBasePath) {
  path = normalizeUrlPath(path) || "";
  apiBasePath = normalizeUrlPath(apiBasePath) || "";

  return baseUrl + (apiBasePath ? `/${apiBasePath}` : "") + `/${path}`;
}

function normalizeUrlPath(path) {
  path = String(path);

  if(path.startsWith("/")) {
    path = stripFirstNCharsFromString(path, 1);
  }

  if(path.endsWith("/")) {
    path = stripLastNCharsFromString(path, 1);
  }

  return path;
}
