const { Umzug, SequelizeStorage } = require("umzug");

/**
 * @param {Object} opts
 * @param {Object} [opts.sequelize]: A Sequelize Connection instance
 * @param {String} [opts.migrationsPath]: The location of the migration files.
 * @param {Object} [opts.logger]: The logger to use, e.g. console
 */
module.exports = function getMigrationHelper(opts) {
  const { sequelize, logger, migrationsPath } = opts || {};

  const umzug = new Umzug({
    migrations: { glob: `${migrationsPath}/*.js` },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: logger,
  });

  return {
    async list(options) {
      if(options.executed) {
        return await umzug.executed();
      } else if(options.pending) {
        return await umzug.pending();
      }

      const [pending, executed] = await Promise.all([
        umzug.pending(),
        umzug.executed()
      ]);

      return [...pending, ...executed];
    },

    async migrate() {
      return await umzug.up();
    },

    async rollback(opts) {
      return await umzug.down(opts);
    },

    async pending() {
      return await this.list({ pending: true });
    },

    async executed() {
      return await this.list({ executed: true });
    },
  };
};
