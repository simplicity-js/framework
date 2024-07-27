/* eslint-env node, mocha */

const path = require("node:path");
const request = require("supertest");
const { STATUS_CODES, STATUS_TEXTS } = require("../component/http");
const { chai } = require("../lib/test-helper");
const Application = require(".");

Application.configure({
  basePath: path.dirname(__dirname) + "/server/test-mocks/src",
  routing: {
    web: {
      prefix: "/",
      definitions: path.join(path.dirname(__dirname), "server/test-mocks/src/routes", "web"),
    },
    api: {
      prefix: "/api",
      definitions: path.join(path.dirname(__dirname), "server/test-mocks/src/routes", "api"),
    },

    health: "/up",
  },
});


module.exports = {
  Application() {
    describe("Application", function routing() {
      let app;
      let expect;

      const port = 5005;
      const host = `http://localhost:${port}`;

      before(async function() {
        expect = (await chai()).expect;

        app = Application.create();

        app.listen(port);
      });

      after(function(done) {
        app.close(done);
      });

      describe("Web Routes", function webRouter() {
        describe("/", function homePage() {
          it("should serve the web base path", function(done) {
            request(host)
              .get("/")
              .expect(200)
              .expect("Content-Type", "text/html; charset=utf-8")
              .end((err, res) => {
                if(err) {
                  return done(err);
                }

                expect(res.text).to.match(/class="page-body"/);
                done();
              });
          });
        });

        describe("/download", function downloadPage() {
          it("should download a file", function downloadPage(done) {
            request(host)
              .get("/download")
              .expect(200)
              .expect("Content-Type", "application/octet-stream")
              .expect("Content-Disposition", "attachment; filename=\"home.pug\"")
              .end(done);
          });
        });
      });

      describe("API Routes", function ApiRouter() {
        describe("/api", function homePage() {
          it("should serve the API base path", function(done) {
            request(host)
              .get("/api")
              .expect(200)
              .expect("Content-Type", "application/json; charset=utf-8")
              .end((err, res) => {
                if(err) {
                  return done(err);
                }

                expect(res.body).to.be.an("object");
                expect(res.body).to.have.property("success", true);
                expect(res.body).to.have.property("message", STATUS_TEXTS[STATUS_CODES.HTTP_OK]);
                done();
              });
          });
        });
      });

      it("should return a (customizable) 404 error page if path does not exist", function(done) {
        request(host)
          .get("/iDontExist")
          .expect(404)
          .expect("Content-Type", "text/html; charset=utf-8")
          .end((err, res) => {
            if(err) {
              return done(err);
            }

            expect(res.text).to.match(/<title>Not Found |/);
            expect(res.text).to.match(/class="page-body"/);
            done();
          });
      });
    });
  },
};
