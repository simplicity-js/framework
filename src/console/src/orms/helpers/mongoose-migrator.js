"use strict";

const MigrateMongoose = require("./migrate-mongoose");

module.exports = function getMigrator(opts) {
  const { dbUrl, dbConnection, collection, migrationsDir, template, logErrors } = opts || {};

  const migrator = new MigrateMongoose({
    migrationsPath  : migrationsDir, // Path to migrations directory
    templatePath    : template, // The template to use when creating migrations needs up and down functions exposed
    dbConnectionUri : dbUrl, // mongo url OR ...
    connection      : dbConnection, // An existing connection to a mongo DB server
    collectionName  : collection, // collection name to use for migrations (defaults to 'migrations')
    autosync        : true, // if making a CLI app, set this to false to prompt the user, otherwise true
    cli             : logErrors,
  });

  return {
    /**
     * Create a new migration
     */
    async createMigration(name) {
      return await migrator.create(name);
    },

    /**
     * List Migrations
     * Example return val
     *
     * Promise which resolves with
     * [
     *  { name: 'my-migration', filename: '149213223424_my-migration.js', state: 'up' },
     *  { name: 'add-cows', filename: '149213223453_add-cows.js', state: 'down' }
     * ]
     *
     */
    async list(options) {
      const { pending, executed } = options || {};

      const data = await migrator.list();

      if(pending) {
        return data.filter(data => data.state === "down");
      }

      if(executed) {
        return data.filter(data => data.state === "up");
      }

      return data;
    },

    /**
     * Synchronize DB with latest migrations from file system
     * Looks at the file system migrations and imports any migrations that are
     * on the file system but missing in the database into the database
     *
     * This functionality is opposite of prune()
     */
    async migrate() {
      return await migrator.run("up");
    },

    async rollback() {
      return await migrator.run("down");
    },

    async close() {
      return await migrator.close();
    },

    async pending() {
      return await this.list({ pending: true });
    },

    async executed() {
      return await this.list({ executed: true });
    }
  };
};
