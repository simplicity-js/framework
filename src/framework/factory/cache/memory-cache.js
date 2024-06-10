const serializer = require("../../component/serializer");

const { serialize, deserialize } = serializer;


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
    set(key, value, { duration }) {
      return store.set(key, serialize(value), duration);
    },

    get(key) {
      const serialized = store.get(key);
      return serialized ? deserialize(serialized) : null;
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
