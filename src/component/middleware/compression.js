"use strict";
const compression = require("compression");


/**
 * Use gzip (default) or deflate compression on static assets.
 * @param {Object} config
 * @param {Array<String>|String} [config.types] (optional):
 *    The content types (Content-Type header) to compress.
 *    This can be an array or a string delimited by any of the following:
 *      - space
 *      - comma (,)
 *      - semicolon (;)
 *      - pipe (|)
 *    For the default content types that should be compressed,
 *    see http://www.senchalabs.org/connect/compress.html#exports.filter
 * @param {Number} [config.threshold] (optional):
 *    Minimum file size threshold for compression to be applied.
 *    Files with a size below this threshold (default: 1024 bytes)
 *    won't be compressed.
 * @param {Number} [config.level] (optional):
 *    The compression level from -1 (default)
 *    through 0 (fastest but least/no compression)
 *    to 9 (slowest but highest compression).
 *    See https://www.npmjs.com/package/compression#level for details.
 * @param {Boolean|String} [config.bypassHeader] (optional):
 *    A request header, that when sent enables us to bypass compression.
 *    Setting this to a falsy value to prevent clients from bypassing compression.
 *    You can then choose to bypass compression on a case-by-case basis
 *    for specific routes you want.
 * @param {Boolean} [config.disable] (optional):
 *    If true, disable compression of static assets
 */
module.exports = function createCompressionMiddleware(config) {
  const { disable, threshold, types, level, bypassHeader } = config.get("compression");
  let compressionLevel = Number(level);
  const contentTypes = (
    Array.isArray(types) ? types : types.split(/[\s+,;|]+/).filter(Boolean)
  ).join("|");
  const typesRegex = new RegExp(contentTypes);

  if(Number.isNaN(compressionLevel) || compressionLevel < 0 || compressionLevel > 9) {
    compressionLevel = -1;
  }

  return compression({
    threshold,
    level: compressionLevel,
    filter: function compressionFilter(req, res) {
      if(bypassHeader && req.headers[bypassHeader]) {
        return false;
      }

      if(disable) {
        return false;
      }

      if(contentTypes.length > 0) {
        // If the user has specified content types to compress,
        // conpress only those...
        return typesRegex.test(res.getHeader("Content-Type"));
      } else {
        // ... otherwise, fallback on the default filter.
        return compression.filter(req, res);
      }
    }
  });
};
