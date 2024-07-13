module.exports = function createMemoryStore({ store }) {
  return {
    driver: "memory",

    /**
     * @param {String} key: the cache key
     * @param {String} value: the value to cache
     * @param {Object} options: caching options
     * @param {Number} [options.duration] (optional): how long (in seconds) to keep
     *   the cached value in the cache.
     */
    set(key, value, options) {
      const { duration } = options ?? {};

      return store.set(key, value, duration);
    },

    get(key) {
      return store.get(key);
    },

    contains(key) {
      return store.has(key);
    },

    size() {
      return store.keys().length;
    },

    unset(key) {
      return store.del(key);
    },

    clear() {
      return store.flushAll();
    },

    stats() {
      return store.getStats();
    },

    client() {
      return store;
    },
  };
};
