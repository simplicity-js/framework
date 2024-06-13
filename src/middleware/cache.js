const hash = require("object-hash");
const { deflate, inflate } = require("../framework/lib/string");

function convertRequestToCacheKey(req) {
  /*
   * Instead of hashing the entire request (req) object,
   * we define a custom object containing only the data
   * we want to include as part of the hash key during the hashing operation.
   * This lets us have more control over the hashing process.
   */
  const { query, body } = req;
  const hashData = { query, body };

  /*
   * When we view the data stored in the hash database,
   * we want to understand which endpoint the <key, value> record refers to.
   * Therefore, we avoid returning the hash directly.
   * Instead, we prefix the request path (req.path) to the hash
   * to make it easier to find keys in the cache store.
   */
  return `${req.path}@${hash.sha1(hashData)}`;
}


/**
 * @param {Object} config (optional)
 * @param {Number} [config.duration] (optional): how long to keep the data in the cache.
 * @param {Function} [config.predicate] (optional): boolean function.
 *   Receives the req and res objects and returns true or false.
 *   If it returns true, the previous cache is cleared.
 */
module.exports = function createCacheMiddleware(config) {
  const { predicate, ...cacheOptions } = config || {};
  const options = { ...cacheOptions };

  return async function cacheRequest(req, res, next) {
    const cache = req.app.resolve("cache");
    const config = req.app.resolve("config");
    const key = convertRequestToCacheKey(req);
    const compress = config.get("cache.compress");

    if(typeof predicate === "function") {
      if(await predicate(req, res) && cache.contains(key)) {
        cache.unset(key);
      }
    }

    /*
     * if there is some cached data,
     * we retrieve and return it.
     */
    const cachedResponse = await readFromCache(key, compress);

    /*
     * If a cached response exists for the current request,
     *   we send it to the client and return, thus terminating the request
     *   without going further down the middleware chain.
     * Otherwise, rewrite res.send with the ability to cache the response.
     *   Then, go deeper down the middleware chain (next()) until the handler.
     *   When the handler calls res.send, the request is handled by our
     *   custom (re-written) res.send which caches the response and calls the
     *   original res.send to send the response and
     *   resets res.send to the original res.send.
     */
    if(cachedResponse) {
      try {
        /*
         * if it is JSON data, return a JSON response...
         */
        return res.json(JSON.parse(cachedResponse));
      } catch {
        /*
         * ...otherwise, return a "regular" response.
         */
        return res.send(cachedResponse);
      }
    } else {
      /*
       * override how res.send behaves
       * to introduce our caching logic.
       */
      const _send = res.send;

      res.send = function (data) {
        /*
         * set the function back to avoid the 'double-send' effect
         */
        res.send = _send;

        /*
         * cache only successful responses
         */
        if(res.statusCode > 199 && res.statusCode < 300) {
          /*
           * We write to the cache in the background;
           * No need to `await`.
           */
          writeToCache(key, data, options, compress);
        }

        return res.send(data);
      };

      next();
    }

    /*
     * Helper functions: readFromCache, writeToCache
     */
    async function readFromCache(key, compressed) {
      let value = await cache.get(key);

      if(value && compressed) {
        value = inflate(value);
      }

      return value;
    }

    async function writeToCache(key, data, options, compress) {
      if(compress) {
        data = deflate(data);
      }

      return await cache.set(key, data, options);
    }
  };
};
