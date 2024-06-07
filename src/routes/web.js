module.exports = function webRouter({ router, download, view }) {

  router.get("/", () => view("home"));
  router.get("/download", () => download("home.pug"));

};
