const serializer = require("../../component/serializer");

const { serialize, deserialize } = serializer;

module.exports = function createFileStore(/*{ storagePath }*/) {
  return {
    driver: "file",

    set(key, value, duration) {
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
