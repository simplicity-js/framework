module.exports = {
  createRouter() {
    require("./test/create-router.test").createRouter();
  },

  laravelToExpress() {
    require("./test/laravel-to-express.test").laravelToExpress();
  },

  paramsFromUri() {
    require("./test/params-from-uri.test").paramsFromUri();
  },

  swaggerExample() {
    require("./test/swagger-example.test").swaggerExample();
  },
};
