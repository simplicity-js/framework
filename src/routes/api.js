const { STATUS_CODES, STATUS_TEXTS } = require("../framework/component/http");
const createCache = require("../framework/component/middleware/cache");

const cache = createCache({ duration: 0 });


module.exports = function apiRouter({ router }) {
  /*
   * Apply the cache middleware to every router in this group.
   */
  router.group({ middleware: [cache] }, (router) => {

    router.get("/", (req, res) => res.status(STATUS_CODES.HTTP_OK).json({
      success: true,
      message: STATUS_TEXTS[STATUS_CODES.HTTP_OK],
    }));

  });

};
