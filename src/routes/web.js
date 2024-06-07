module.exports = function webRouter({ router }) {
  router.get("", (req, res) => res.send("Welcome to home page!"));
};
