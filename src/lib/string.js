const crypto = require("node:crypto");
const zlib = require("node:zlib");

module.exports = {
  camelCaseToSnakeCase,
  encode: encodeToBase,
  decode: decodeFromBase,
  deflate,
  inflate,
  hash,
  isPath,
  LCFirst,
  stripFirstNCharsFromString,
  stripLastNCharsFromString,
};

function camelCaseToSnakeCase(str, separator = "-") {
  return (
    str
      .replace(/([A-Z]+)/g, (_, c) => `${separator}${c.toLowerCase()}`)
      .replace(new RegExp(`^${separator}`), "") // strip off the `-` preceding the first CAPS letter
  );
}

/**
 * encodeToBase: encode a string.
 * @param {String} str: The string to encode.
 * @param {String} base: the base to encode the string to.
 *   Valid bases include "ascii", "utf-8", "base64".
 *   Default is base64.
 * @return {String}
 */
function encodeToBase(str, base = "base64") {
  return encode(str, { to: base });
}

/**
 * decodeFromBase: decode a string.
 * @param {String} str: the encoded string.
 * @param {String} base: the base in which the string was encoded.
 *   That is, the base to decode it from.
 *   Valid bases include "ascii", "utf-8", "base64".
 *   Default is base64.
 * @return {String}: the original string.
 */
function decodeFromBase(str, base = "base64") {
  return encode(str, { from: base });
}

function deflate(data) {
  return zlib.deflateSync(data).toString("base64");
}

function inflate(value) {
  return zlib.inflateSync(Buffer.from(value, "base64")).toString();
}

/**
 * Creates a checksum/hash of string using specified algorithm.
 *
 * Possible algos: "md5", "sha1", sha256, sha512, etc
 */
function hash(string, algo = "md5") {
  return crypto.createHash(algo).update(string).digest("hex");
}

/**
 * Check if the given string is a path
 */
function isPath(string) {
  if(string.search(/\n/) > -1) {
    return false; // If we find a newline character, it is not a path
  } else if(/<[^>]*>/g.test(string)) {
    return false; // If it contains HTML tags, it is not a path
  } // TO DO: we need to have a test for template engine tags also

  return true;
}

function LCFirst(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Encode a string in one format to another
 * @param {String} str: the string to encode
 * @param {Object} opts (optional)
 * @param {String} [opts.from] (optional): the format you are encoding from.
 *   Example values are "ascii", "utf-8", "base64".
 * @param {String} [opts.to] (optional): the format you are encoding to.
 *   Example values are "ascii", "utf-8" (default), "base64".
 * @return {String} the encoded string.
 */
function encode(str, opts) {
  // Cf: https://stackoverflow.com/a/57718036/1743192
  let encoded = "";
  const { from, to } = (opts || {});

  if(!str) {
    encoded = str;
  } else if(from && to) {
    encoded = Buffer.from(str, from).toString(to);
  } else if(from) {
    encoded = Buffer.from(str, from);
  } else if(to) {
    encoded = Buffer.from(str).toString(to);
  } else {
    encoded = Buffer.from(str);
  }

  return encoded;
}

function stripFirstNCharsFromString(str, n = 1) {
  return str.substring(n);
}

function stripLastNCharsFromString(str, n = 1) {
  return str.substring(0, str.length - n);
}
