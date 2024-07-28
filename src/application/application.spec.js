/* eslint-env node, mocha */

const path = require("node:path");
const request = require("supertest");
const { STATUS_CODES, STATUS_TEXTS } = require("../component/http");
const { chai } = require("../lib/test-helper");
const config = require("../server/test-mocks/src/config");
const Application = require(".");

const healthCheckRoute = "/up";
const applicationBootstrapConfig = {
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
    health: healthCheckRoute,
  },
};

Application.configure(applicationBootstrapConfig);


module.exports = {
  Application() {
    describe("Application", function routing() {
      let expect;

      before(async function() {
        expect = (await chai()).expect;
      });

      describe("Routing", function() {
        let app;

        const port = 5005;
        const host = `http://localhost:${port}`;

        before(function(done) {
          app = Application.create();
          app.listen(port);
          done();
        });

        after(function(done) {
          app.stop(done);
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

      describe("listen", function() {
        it("should listen on `port` argument", function(done) {
          const port = 5006;
          const host = "http://localhost";
          const app = Application.create();

          app.listen(port);

          request(`${host}:${port}`)
            .get("/")
            .expect(200)
            .expect("Content-Type", "text/html; charset=utf-8")
            .end((err, res) => {
              if(err) {
                return done(err);
              }

              expect(res.text).to.match(/class="page-body"/);
              app.stop(done);
            });
        });

        it("should listen on `--port` CLI argument", function(done) {
          this.timeout(5000);
          const port = 5007;
          const host = "http://localhost";
          const currDir = path.dirname(__filename).replace(/\\/g, "/");

          function execInBackground(command, args, stdoutFile, stderrFile) {
            args = args || [];

            const fs = require("node:fs");
            const out = fs.openSync(stdoutFile, "a");
            const err = fs.openSync(stderrFile, "a");

            const ps = require("node:child_process").spawn(command, args, {
              detached: true,
              stdio: ["ignore", out, err],
              shell: true
            });

            ps.unref();
          };

          function startServer(port) {
            const command = `node -e "require('${currDir}/cli-port-argument-server').listen()"`;

            return execInBackground(
              command,
              ["-- --port", port],
              `${currDir}/out.log`,
              `${currDir}/err.log`
            );
          }

          startServer(port);

          setTimeout(function() {
            request(`${host}:${port}`)
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
          }, 3000);

        });

        it("should listen on `config.app.port`", function(done) {
          const Application = require(".");
          const host = "http://localhost";
          const oldGet = config.get;

          Application.configure(applicationBootstrapConfig);

          const app = Application.create();

          config.get = function(key) {
            if(key === "app.port") {
              return 9000;
            }

            return oldGet(key);
          };

          app.listen();

          request(`${host}:${config.get("app.port")}`)
            .get("/")
            .expect(200)
            .expect("Content-Type", "text/html; charset=utf-8")
            .end((err, res) => {
              if(err) {
                return done(err);
              }

              expect(res.text).to.match(/class="page-body"/);
              config.get = oldGet;
              app.stop(done);
            });
        });

        it("should listen on default port 8800 if no port specified", function(done) {
          const defaultPort = 8800;
          const host = "http://localhost";
          const app = Application.create();

          app.listen();

          request(`${host}:${defaultPort}`)
            .get("/")
            .expect(200)
            .expect("Content-Type", "text/html; charset=utf-8")
            .end((err, res) => {
              if(err) {
                return done(err);
              }

              expect(res.text).to.match(/class="page-body"/);
              app.stop(done);
            });
        });
      });
    });
  },
};
