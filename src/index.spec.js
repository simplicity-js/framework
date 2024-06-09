/* eslint-env node, mocha */

const request = require("supertest");
const { StatusCodes, StatusTexts } = require("./framework/http");
const { chai } = require("./lib/test-helper");
const server = require(".");

let expect;

before(async function() {
  expect = (await chai()).expect;
});

after(function(done) {
  // Call done() before stopping the server(s) (terminating the process);
  // so that we can get the test report (20 passing, etc)
  // before the process is terminated.
  setTimeout(function stopServer() { process.exit(0); }, 0);
  done();
});


module.exports = {
  start() {
    describe("server.start({ port, onError, onListening })", function() {
      it("should call the `onError` function if an error occurs", function(done) {
        const SHARED_PORT = 5000;

        server.start({ port: SHARED_PORT });
        server.start({ port: SHARED_PORT, onError: function onError(error, port) {
          expect(error.code).to.equal("EADDRINUSE");
          expect(port).to.equal(SHARED_PORT);

          done();
        }});
      });

      it("should call the `onListening` function on server listening", function(done) {
        const port = 5001;

        server.start({ port, onError: done, onListening: function onListening(server) {
          expect(server).to.be.an("object");
          expect(server).to.have.property("address").to.be.a("function");
          expect(server.address()).to.be.an("object");
          expect(server.address().port).to.equal(port);

          done();
        }});
      });
    });
  },

  routes() {
    describe("Routes", function routes() {
      const port = 5002;
      const host = `http://localhost:${port}`;

      server.start({ port, onError: console.log });

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
    });
  },
};
