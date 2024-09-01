/* eslint-env node, mocha */

const childProcess = require("node:child_process");
const path = require("node:path");
const kill = require("tree-kill");
const request = require("supertest");
const { STATUS_CODES, STATUS_TEXTS } = require("../component/http");
const { chai } = require("../lib/test-helper");
const overrideConsoleDotLog = require("../server/test-mocks/console-override");
const config = require("../server/test-mocks/src/config");
const Application = require(".");

const currDir = path.dirname(__filename).replace(/\\/g, "/");
const healthCheckRoute = "/up";
const applicationBootstrapConfig = {
  basePath: path.dirname(__dirname) + "/server/test-mocks",
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
const DEFAULT_PORT = 8800;

Application.configure(applicationBootstrapConfig);

function execInBackground(command, args) {
  args = args || [];

  const ps = childProcess.spawn(command, args, {
    detached: true,
    shell: true,
  });

  ps.unref();

  return ps;
};


module.exports = {
  Application() {
    describe("Application", function routing() {
      let expect;
      let restoreConsoleDotLog;

      before(async function() {
        expect = (await chai()).expect;

        restoreConsoleDotLog = overrideConsoleDotLog(`${currDir}/console.log`);
      });

      after(function(done) {
        restoreConsoleDotLog();
        done();
      });

      beforeEach(function(done) {
        overrideConsoleDotLog(`${currDir}/console.log`);
        done();
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
          it("should server the HTML web page by default", function(done) {
            request(host)
              .get(healthCheckRoute)
              .expect(200)
              .expect("Content-Type", "text/html; charset=utf-8")
              .end((err, res) => {
                if(err) {
                  return done(err);
                }

                expect(res.text).to.match(/Application up/);
                expect(res.text).to.match(/Uptime \d+ days, \d+ hours, \d+ minutes, \d+ seconds./);
                done();
              });
          });

          it("should send a JSON response if the 'format' query string is set to 'json'", function(done) {
            request(host)
              .get(`${healthCheckRoute}?format=json`)
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
          this.timeout(5000);

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

        it("should listen on `--port PORT` CLI argument", function(done) {
          this.timeout(1000 * 20);

          const port = 5007;
          const host = "http://localhost";

          function startServer(port) {
            const command = `node -e "require('${currDir}/cli-port-argument-server').listen()"`;

            return execInBackground(command, [`-- --port ${port}`]);
          }

          const child = startServer(port);

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
                setTimeout(() => kill(child.pid, "SIGKILL", done), 0);
              });
          }, 1000 * 10);

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

        it(`should listen on default port ${DEFAULT_PORT} if no port specified`, function(done) {
          const host = "http://localhost";
          const app = Application.create();

          app.listen();

          request(`${host}:${DEFAULT_PORT}`)
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

      describe("dispatch", function() {
        describe("commands", function() {
          describe("[\"start\"]", function() {
            const tests = [
              {
                description: `should serve the app on the default port ${DEFAULT_PORT} if the --port option is not passed`,
                port: DEFAULT_PORT,
                commandArgs: [],
              },
              {
                description: "should serve the app on the specified port using --port=PORT option",
                port: 6007,
                commandArgs: ["--port=6007"],
              },
              {
                description: "should serve the app on the specified port using --port PORT option",
                port: 6009,
                commandArgs: ["--port", 6009],
                useEval: true,
              },
              {
                description: "should serve the app on the specified port using -p PORT option",
                port: 6010,
                commandArgs: ["-p", 6010],
                useEval: true,
              },
            ];

            function runRequestAndTest(host, port, callback) {
              request(`${host}:${port}`)
                .get("/")
                .expect(200)
                .expect("Content-Type", "text/html; charset=utf-8")
                .end((err, res) => {
                  if(err) {
                    return callback(err);
                  }

                  expect(res.text).to.match(/class="page-body"/);

                  callback();
                });
            }

            tests.forEach(test => {
              it(test.description, function(done) {
                this.timeout(1000 * 20);

                const app = Application.create();
                const host = "http://localhost";

                if(test.useEval) {
                  const child = execInBackground(
                    `node -e "require('${currDir}/cli-port-argument-server').dispatch()"`,
                    ["start"].concat(test.commandArgs)
                  );

                  setTimeout(() => {
                    runRequestAndTest(host, test.port, (err) => {
                      setTimeout(() => kill(child.pid, "SIGKILL", () => {
                        if(err) {
                          done(err);
                        } else {
                          done();
                        }
                      }), 0);
                    });
                  }, 1000 * 10);
                } else {
                  app.dispatch(["start"].concat(test.commandArgs));
                  runRequestAndTest(host, test.port, (err) => {
                    if(err) {
                      done(err);
                    } else {
                      app.stop(done);
                    }
                  });
                }
              });
            });
          });

          describe("[\"down\"]", function() {
            const tests = [
              {
                description: "send a 503 Service Unavailable response",
                port: 6011,
                commandArgs: [],
              },
              {
                description: "send a refresh header if passed the --refresh option",
                port: 6012,
                commandArgs: ["--refresh=15"],
                expectation: async (res, done) => {
                  expect(Number(res.headers["refresh"])).to.equal(15);
                  await done();
                }
              },
              {
                description: "allow access with a secret if passed a --secret option",
                port: 6013,
                commandArgs: ["--secret=secret"],
                expectation: (res, done) => {
                  request("http://localhost:6013")
                    .get("/secret")
                    .expect(302)
                    .expect("Location", "/")
                    .end((err) => err ? done(err) : done());
                }
              },
            ];

            function runRequestAndTest(host, port, callback) {
              request(`${host}:${port}`)
                .get("/")
                .expect(503)
                .end((err, res) => {
                  if(err) {
                    return callback(err);
                  }

                  expect(res.text).to.match(/Service Unavailable/);

                  callback(res);
                });
            }

            tests.forEach(async test => {
              it(`should put the server in maintenance mode and ${test.description}`, function(done) {
                this.timeout(1000 * 20);

                const app = Application.create();
                const host = "http://localhost";
                const port = test.port;

                app.dispatch(["start"].concat([`--port=${port}`]));

                request(`${host}:${port}`)
                  .get("/")
                  .expect(200)
                  .expect("Content-Type", "text/html; charset=utf-8")
                  .end(async (err) => {
                    if(err) {
                      return done(err);
                    }

                    await app.dispatch(["down"].concat(test.commandArgs));

                    runRequestAndTest(host, port, (res) => {
                      if(test.expectation) {
                        test.expectation(res, err => {
                          if(err) {
                            app.dispatch(["up"]);
                            done(err);
                          } else {
                            app.dispatch(["up"]);
                            app.stop(done);
                          }
                        });
                      } else {
                        app.dispatch(["up"]);
                        app.stop(done);
                      }
                    });
                  });
              });
            });
          });

          describe("[\"up\"]", function() {
            it("should take the server out of maintenance mode", function(done) {
              this.timeout(1000 * 20);

              const app = Application.create();
              const host = "http://localhost";
              const port = 6014;

              app.dispatch(["start"].concat([`--port=${port}`]));

              request(`${host}:${port}`)
                .get("/")
                .expect(200)
                .expect("Content-Type", "text/html; charset=utf-8")
                .end(async (err) => {
                  if(err) {
                    return done(err);
                  }

                  await app.dispatch(["down"]);

                  request(`${host}:${port}`)
                    .get("/")
                    .expect(503)
                    .end(async (err, res) => {
                      if(err) {
                        return done(err);
                      }

                      expect(res.text).to.match(/Service Unavailable/);

                      await app.dispatch(["up"]);

                      request(`${host}:${port}`)
                        .get("/")
                        .expect(200)
                        .expect("Content-Type", "text/html; charset=utf-8")
                        .end((err) => err ? done(err) : app.stop(done));
                    });
                });
            });
          });

          describe("[\"stop\"]", function() {
            it("should stop the server", function(done) {
              const app = Application.create();
              const host = "http://localhost";
              const port = 6015;

              app.dispatch(["start", `--port=${port}`]);

              request(`${host}:${port}`)
                .get("/")
                .expect(200)
                .expect("Content-Type", "text/html; charset=utf-8")
                .end((err, res) => {
                  if(err) {
                    return done(err);
                  }

                  expect(res.text).to.match(/class="page-body"/);

                  app.dispatch(["stop"]).then(() => {
                    request(`${host}:${port}`)
                      .get("/")
                      .end((err) => {
                        const expectedErrorMessage = "ECONNREFUSED: Connection refused";

                        if(!err || err.message !== expectedErrorMessage) {
                          return done(new Error(
                            `Expected ${expectedErrorMessage} got ${err}`
                          ));
                        }

                        expect(err.message).to.equal(expectedErrorMessage);
                        done();
                      });
                  });
                });
            });
          });
        });
      });
    });
  },
};
