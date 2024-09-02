module.exports = {
  default: "sqlite",
  connections: {
    sqlite: {
      dbEngine    : "sqlite",
      dbName      : "simplicity_db",
      logging     : false,
      storagePath : "app/database",
    },
  },
};
