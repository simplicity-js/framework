const { STATUS_CODES, STATUS_TEXTS } = require("../../../../component/http");


module.exports = function apiRouter({ router }) {
  router.get("/", (req, res) => res.status(STATUS_CODES.HTTP_OK).json({
    success: true,
    message: STATUS_TEXTS[STATUS_CODES.HTTP_OK],
  }));
};
