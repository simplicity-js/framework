const Cache = require("file-system-cache").default;


module.exports = function createFileStore({ storagePath }) {
  const store = Cache({ basePath: storagePath });

  return {
    driver: "file",

    async set(key, value, options) {
      const { duration } = options ?? {};

      return await store.set(key, value, duration);
    },

    async get(key) {
      return await store.get(key);
    },

    async contains(key) {
      return !!(await this.get(key));
    },

    async unset(key) {
      return await store.remove(key);
    },

    async clear() {
      return await store.clear();
    },

    client() {
      return store;
    },
  };
};
