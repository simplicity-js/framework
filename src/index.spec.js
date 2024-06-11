/* eslint-env node, mocha */

const request = require("supertest");
const { StatusCodes, StatusTexts } = require("./framework/component/http");
const { chai } = require("./lib/test-helper");
const startServer = require(".");

module.exports = {
  createServer() {
    describe("startServer({ host, port, onError, onListening })", function() {
      let expect;

      before(async function() {
        expect = (await chai()).expect;
      });

      it("should return a Node.js HTTP server", function(done) {
        const server = startServer({ port: 5000 });
        const serverMethods = ["address", "close", "listen"];

        expect(server).to.be.an("object");

        for(const method of serverMethods) {
          expect(server).to.have.property(method).to.be.a("function");
        }

        server.close(done);
      });
    });
  },

  start() {
    describe("server.start({ port, onError, onListening })", function() {
      let expect;

      before(async function() {
        expect = (await chai()).expect;
      });

      it("should call the `onError` function if an error occurs", function(done) {
        const SHARED_PORT = 5000;

        const server1 = startServer({ port: SHARED_PORT });
        const server2 = startServer({ port: SHARED_PORT, onError: function onError(error, port) {
          expect(error.code).to.equal("EADDRINUSE");
          expect(port).to.equal(SHARED_PORT);

          server2.close(() => server1.close(done));
        }});
      });

      it("should call the `onListening` function on server listening", function(done) {
        const port = 5001;

        startServer({ port, onError: done, onListening: function onListening(server) {
          expect(server).to.be.an("object");
          expect(server).to.have.property("address").to.be.a("function");
          expect(server.address()).to.be.an("object");
          expect(server.address().port).to.equal(port);

          server.close(done);
        }});
      });
    });
  },

  routes() {
    describe("Routes", function routes() {
      let expect;
      let server;

      const port = 5002;
      const host = `http://localhost:${port}`;

      before(async function() {
        expect = (await chai()).expect;
        server = startServer({ port, onError: console.log });
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
                expect(res.body).to.have.property("message", StatusTexts[StatusCodes.HTTP_OK]);
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
