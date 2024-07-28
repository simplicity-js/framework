/* eslint-env node, mocha */

const request = require("supertest");
const bootstrap = require("../../bootstrap");
const container = require("../../component/container");
const { STATUS_CODES, STATUS_TEXTS } = require("../../component/http");
const { chai } = require("../../lib/test-helper");
const config = require("../test-mocks/src/config");
const providers = require("../test-mocks/src/service-providers");
const { createApp } = require("../app");
const createServer = require(".");

const healthCheckRoute = "/up";

function getRoutes() {
  const routes = {
    web: { prefix: "/",    router: require("../test-mocks/src/routes/web") },
    api: { prefix: "/api", router: require("../test-mocks/src/routes/api") },
    healthCheckRoute,
  };

  return routes;
}


module.exports = {
  createServer() {
    describe("createServer({ app, onError, onListening })", function() {
      let app;
      let expect;

      before(async function() {
        app = createApp({ config, container, routes: getRoutes() });
        expect = (await chai()).expect;
      });

      it("should return a Node.js HTTP server", function(done) {
        const server = createServer({ app });
        const serverMethods = ["address", "close", "listen"];

        expect(server).to.be.an("object");

        for(const method of serverMethods) {
          expect(server).to.have.property(method).to.be.a("function");
        }

        done();
      });

      it("should call the `onError` function if an error occurs", function(done) {
        const SHARED_PORT = 5000;
        const app2 = createApp({ config, container, routes: getRoutes() });
        const server1 = createServer({ app });
        const server2 = createServer({ app: app2, onError: function onError(error) {
          expect(error.code).to.equal("EADDRINUSE");
          expect(error.port).to.equal(SHARED_PORT);

          server2.close(() => server1.close(done));
          //server.close(done);
        }});

        server1.listen(SHARED_PORT);
        server2.listen(SHARED_PORT);
      });

      it("should call the `onListening` function on server listening", function(done) {
        const port = 5001;
        const server = createServer({ app, onError: done, onListening: function onListening(server) {
          expect(server).to.be.an("object");
          expect(server).to.have.property("address").to.be.a("function");
          expect(server.address()).to.be.an("object");
          expect(server.address().port).to.equal(port);

          server.close(done);
        }});

        server.listen(port);
      });
    });
  },

  routes() {
    describe("Routes", function routing() {
      let app;
      let expect;
      let server;

      const port = 5002;
      const host = `http://localhost:${port}`;

      before(async function() {
        expect = (await chai()).expect;

        bootstrap(config, providers);

        app = createApp({ config, container, routes: getRoutes() });
        server = createServer({ app, onError: console.log });

        server.listen(port);
      });

      after(function(done) {
        server.close(done);
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

      describe(`Health Check Route (${healthCheckRoute})`, function serverHealthRoute() {
        it("should get the server's health status", function(done) {
          request(host)
            .get(healthCheckRoute)
            .expect(200)
            .expect("Content-Type", "application/json; charset=utf-8")
            .end((err, res) => {
              if(err) {
                return done(err);
              }

              expect(res.body).to.be.an("object");
              expect(res.body).to.have.property("application").to.be.an("object");
              expect(res.body).to.have.property("server").to.be.an("object");
              expect(res.body.application).to.have.property("name", config.get("app.name"));
              expect(res.body.application).to.have.property("version", config.get("app.version"));
              expect(res.body.server).to.have.property("status", "healthy");
              expect(res.body.server).to.have.property("uptime");
              done();
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
