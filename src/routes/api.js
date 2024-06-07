module.exports = function apiRouter({ router }) {
  router.get("/", (req, res) => res.send("API Route!"));
};
