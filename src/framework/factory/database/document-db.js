const MongooseStore = require("../../component/connector/mongoose");


/**
 * Create new MongooseStore
 *
 * @param {Object} options object with properties:
 * @param {String} [options.host]: the db server host
 * @param {Number} [options.port]: the db server port
 * @param {String} [options.username]: the db server username
 * @param {String} [options.password]: the db server user password
 * @param {String} [options.dbName]: the name of the database to connect to
 * @param {String} [options.url]: full DSN of the mongodb server
 *   If the [options.url] is set, it is used instead
 *   and the other options (except [options.debug]) are ignored.
 *   For this reason, when using the url option, also specify the database name
 *   in the DSN string.
 * @param {Boolean} [options.debug] determines whether or not to show debugging output
 */
module.exports = async function createDocumentStore(options) {
  const mongooseStore = new MongooseStore(options);
  /* const driver = "mongodb";
  let db;

  if(!mongooseStore.connecting() && !mongooseStore.connected()) {
    db = await mongooseStore.connect();
  } else {
    db = mongooseStore.getClient();
  }

  return { db, driver };*/

  if(!mongooseStore.connecting() && !mongooseStore.connected()) {
    await mongooseStore.connect();
  }

  return mongooseStore;
};
