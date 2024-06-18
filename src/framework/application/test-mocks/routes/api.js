module.exports = function apiRouter({ router, STATUS_CODES, STATUS_TEXTS }) {
  router.get("/", (req, res) => res.status(STATUS_CODES.HTTP_OK).json({
    success: true,
    message: STATUS_TEXTS[STATUS_CODES.HTTP_OK],
  }));
};
