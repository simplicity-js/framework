const { stripFirstNCharsFromString, stripLastNCharsFromString } = require("./string");

module.exports = {
  getValidUrl,
  normalizeUrlPath,
};


function getValidUrl(baseUrl, path, apiBasePath) {
  path = normalizeUrlPath(path) || "";
  apiBasePath = normalizeUrlPath(apiBasePath) || "";

  let url = baseUrl;

  if(apiBasePath) {
    url += `/${apiBasePath}`;
  }

  url += `/${path}`;

  return url;
}

function normalizeUrlPath(path) {
  if(path?.startsWith("/")) {
    path = stripFirstNCharsFromString(path, 1);
  }

  if(path?.endsWith("/")) {
    path = stripLastNCharsFromString(path, 1);
  }

  return path;
}
