const is = require("../lib/is");
const { getObjectValue, setObjectValue } = require("../lib/object");


module.exports = function createObjectStore() {
  let store = {};

  return class ObjectStore {
    /**
     * Add an object to the registry.
     *
     * Allows us to insert nested values to an object
     * without pre-defining the object.
     * For example, we can do the following:
     *
     *    registry.add("my.object.nested.key", value);
     *
     * without first having to do pre-create the my.object.nested
     * using syntax similar to the following:
     *    const my = { object: { nested: } };
     *    my.object.nested.key = value;
     *
     * @param {String} key
     * @param {Any} value
     */
    static add(key, value) {
      store = setObjectValue(store, key, value);
    }

    static contains(key) {
      return is.undefined(getObjectValue(store, key)) ? false : true;
    }

    /**
     * Retrieve a previously stored object from the registry by its key.
     *
     * lets us specify a default value to retrieve
     * when attempting to retrieve a value that may (not) exist in the registry:
     *
     *    const value = registry.get(key, defaultValue);
     *
     * If an object has been stored with the `key` key in the registry,
     * value will be that object, otherwise, value will be whatever is passed as
     * defaultValue (or undefined if no defaultValue is specified).
     *
     * @param {String} key
     * @param {Any} defaultValue
     * @return {Any}
     */
    static get(key, defaultValue) {
      return getObjectValue(store, key, defaultValue);
    }

    static remove(key) {
      if(ObjectStore.contains(key)) {
        setObjectValue(store, key, undefined);
      }
    }
  };
};
