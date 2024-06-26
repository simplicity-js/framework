/* eslint-env node, mocha */

const request = require("supertest");
const { STATUS_CODES, STATUS_TEXTS } = require("../../component/http");
const { chai } = require("../../lib/test-helper");
const config = require("../test-mocks/config");
const webRouter = require("../test-mocks/routes/web");
const apiRouter = require("../test-mocks/routes/api");
const providers = require("../test-mocks/service-providers");
const { createApp } = require("../app");
const createServer = require(".");


module.exports = {
  createServer() {
    describe("createServer({ app, onError, onListening })", function() {
      let app;
      let expect;

      before(async function() {
        app = createApp({ config, apiRouter, webRouter, providers });
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
        const app2 = createApp({ config, apiRouter, webRouter, providers });
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

  /*start() {
    describe("Server instance", function() {
      describe(".listen({ port, onError, onListening })", function() {
        let expect;
        let app;

        before(async function() {
          expect = (await chai()).expect;
          app = createApp({ config, webRouter, apiRouter });
        });

        it("should call the `onError` function if an error occurs", function(done) {
          const SHARED_PORT = 5000;

          const server1 = app.listen(SHARED_PORT);
          const server2 = app.listen(SHARED_PORT, { onError: function onError(error, port) {
            expect(error.code).to.equal("EADDRINUSE");
            expect(port).to.equal(SHARED_PORT);

            server2.close(() => server1.close(done));
          }});
        });

        it("should call the `onListening` function on server listening", function(done) {
          const port = 5001;

          app.listen(port, { onError: done, onListening: function onListening(server) {
            expect(server).to.be.an("object");
            expect(server).to.have.property("address").to.be.a("function");
            expect(server.address()).to.be.an("object");
            expect(server.address().port).to.equal(port);

            server.close(done);
          }});
        });
      });
    });
  },*/

  routes() {
    describe("Routes", function routes() {
      let app;
      let expect;
      let server;

      const port = 5002;
      const host = `http://localhost:${port}`;

      before(async function() {
        expect = (await chai()).expect;
        app = createApp({ config, webRouter, apiRouter, providers });
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

      it("should return a (custom) 404 error page if path does not exist", function(done) {
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
