/* eslint-env node, mocha */

"use strict";

const path = require("node:path");
const express = require("express");
const request = require("supertest");
const overrideConsoleDotLog = require("../../server/test-mocks/console-override");
const { METHODS } = require("../http");
const Router = require(".");

let restoreConsoleDotLog;
const methods = METHODS;
const app = express();
const currDir = path.dirname(__filename).replace(/\\/g, "/");


module.exports = {
  Router() {
    describe("Router.router()", function createApp_Spec() {
      before(async function() {
        restoreConsoleDotLog = overrideConsoleDotLog(`${currDir}/console.log`);
      });

      after(function(done) {
        restoreConsoleDotLog();
        done();
      });

      describe("Basic routing via router.{method} (or router[method])", function() {
        const router = Router.router();

        methods.forEach(method => {
          it(`router.${method}(uri, handler) should setup routing for '${method.toUpperCase()}' requests`, function(done) {
            const uri = "/foo";

            router[method](uri, (req, res) => res.send("OK"));
            router.apply(route => app[route.method](route.path, route.handlers));

            request(app)[method](uri).expect(200, done);
          });
        });
      });

      describe("Extended features", function() {
        describe("router.controller(controller, closure)", function() {
          const app = express();
          const router = Router.router();
          const controller = {
            index: (req, res) => res.send("show entity listing"),
            new: (req, res) => res.send("display entity creation form"),
            create: (req, res) => res.send("create new entity"),
            show: (req, res) => res.send("show entity details"),
            edit: (req, res) => res.send("display entity edit form"),
            update: (req, res) => res.send("update entity data"),
            destroy: (req, res) => res.send("delete entity"),
          };

          router.controller(controller, (router) => {
            router.get("/entities", "index");
            router.get("/entities/new", "new");
            router.post("/entities", "create");
            router.get("/entities/{id}", "show");
            router.get("/entities/{id}/edit", "edit");
            router.put("/entities/{id}", "update");
            router.patch("/entities/:id", "update");
            router.delete("/entities/{id}", "destroy");
          });

          const expectations = [
            { uri: "/entities",           method: "get",    response: "show entity listing" },
            { uri: "/entities/new",       method: "get",    response: "display entity creation form" },
            { uri: "/entities",           method: "post",   response: "create new entity" },
            { uri: "/entities/:id",       method: "get",    response: "show entity details" },
            { uri: "/entities/{id}/edit", method: "get",    response: "display entity edit form" },
            { uri: "/entities/:id",       method: "put",    response: "update entity data" },
            { uri: "/entities/{id}",      method: "patch",  response: "update entity data" },
            { uri: "/entities/:id",       method: "delete", response: "delete entity" },
          ];

          router.apply(route => app[route.method](route.path, route.handlers));

          expectations.forEach(({ uri, method, response }) => {
            it(`should apply controller method to route '${method.toUpperCase()} ${uri}'`, function(done) {
              const currRequest = request(app)[method](uri.replace(/\{id\}|:id/, 1));

              currRequest.expect(200, response);
              currRequest.end(done);
            });
          });
        });

        describe("router.middleware(middleware, closure)", function() {
          it("should apply a single mdidleware to the routes", function(done) {
            let counter = 0;
            const app = express();
            const router = Router.router();
            const paths = ["first", "second", "third"];
            const middleware = (req, res, next) => {
              req.message = "middleware hit";
              next();
            };

            router.middleware(middleware, (router) => {
              paths.forEach(path => router.get(
                `/${path}`, (req, res) => res.send(`${path} ${req.message}`)));
            });

            router.apply(route => app[route.method](route.path, route.handlers));

            paths.forEach(path => {
              const currRequest = request(app).get(`/${path}`);

              currRequest.expect(200, `${path} middleware hit`);
              currRequest.end(() => {
                ++counter;
                if(counter === paths.length) {
                  done();
                }
              });
            });
          });

          it("should apply an array of middleware to the routes", function(done) {
            let counter = 0;
            const app = express();
            const router = Router.router();
            const paths = ["first", "second", "third"];
            const middlewares = [];

            for(let i = 0; i < 3; i++) {
              middlewares.push(
                (req, res, next) => {
                  const msg = `hit ${i + 1}`;

                  req.message = req.message ? req.message + msg : msg;
                  next();
                }
              );
            }

            router.middleware(middlewares, (router) => {
              paths.forEach(path => router.get(
                `/${path}`, (req, res) => res.send(`${path} ${req.message}`)));
            });

            router.apply(route => app[route.method](route.path, route.handlers));

            paths.forEach(path => {
              const currRequest = request(app).get(`/${path}`);

              currRequest.expect(200, `${path} hit 1 hit 2 hit 3`);
              currRequest.end(() => {
                ++counter;
                if(counter === paths.length) {
                  done();
                }
              });
            });
          });
        });

        describe("router.resource(resource, controller)", function() {
          const app = express();
          const router = Router.router();
          class PostController {
            index(req, res) { res.send("show posts listing"); }
            new(req, res) { res.send("display post creation form"); }
            create(req, res) { res.send("create new post"); }
            show(req, res) { res.send("show post details"); }
            edit(req, res) { res.send("display post edit form"); }
            update(req, res) { res.send("update post data"); }
            destroy(req, res) { res.send("delete post"); }
          }

          router.resource("/posts", new PostController);

          const expectations = [
            { uri: "/posts",           method: "get",    response: "show posts listing" },
            { uri: "/posts/new",       method: "get",    response: "display post creation form" },
            { uri: "/posts",           method: "post",   response: "create new post" },
            { uri: "/posts/{id}",      method: "get",    response: "show post details" },
            { uri: "/posts/{id}/edit", method: "get",    response: "display post edit form" },
            { uri: "/posts/:id",       method: "put",    response: "update post data" },
            { uri: "/posts/:id",       method: "patch",  response: "update post data" },
            { uri: "/posts/{id}",      method: "delete", response: "delete post" },
          ];

          router.apply(route => app[route.method](route.path, route.handlers));

          expectations.forEach(({ uri, method, response }) => {
            it(`should create '${method.toUpperCase()} ${uri}' route for passed resource ('posts')`, function(done) {
              const currRequest = request(app)[method](uri.replace(/\{id\}|:id/, 1));

              currRequest.expect(200, response);
              currRequest.end(done);
            });
          });
        });

        describe("router.match(verbs, uri, closure)", function() {
          it("should setup routing for an array of HTTP verbs", function(done) {
            let counter = 0;
            const app = express();
            const router = Router.router();
            const uri = "/bar";

            router.match(methods, uri, (req, res) => res.send("OK"));
            router.apply(route => app[route.method](route.path, route.handlers));

            methods.forEach(method => {
              request(app)[method](uri)
                .expect(200, "OK")
                .end(() => {
                  if(++counter === methods.length) {
                    done();
                  }
                });
            });
          });
        });

        describe("router.any(uri, closure)", function() {
          it("should setup routing for all HTTP verb", function(done) {
            let counter = 0;
            const app = express();
            const router = Router.router();
            const uri = "/foo-bar";

            router.any(uri, (req, res) => res.send("OK"));
            router.apply(route => app[route.method](route.path, route.handlers));

            methods.forEach(method => {
              request(app)[method](uri)
                .expect(200, "OK")
                .end(() => {
                  if(++counter === methods.length) {
                    done();
                  }
                });
            });
          });
        });

        describe("router.redirect(fromUri, toUri[, statusCode])", function() {
          describe("router.redirect(fromUri, toUri)", function() {
            const app = express();
            const router = Router.router();

            router.redirect("/from", "/to");
            router.apply(route => app[route.method](route.path, route.handlers));

            methods.forEach(method => {
              it(`should redirect '${method.toUpperCase()}' requests and return a 302 status code`, function(done) {
                request(app)[method]("/from").expect(302, done);
              });
            });
          });

          describe("router.redirect(fromUri, toUri, statusCode)", function() {
            const app = express();
            const router = Router.router();
            const statusCode = 303;

            router.redirect("/fromUri", "/toUri", statusCode);
            router.apply(route => app[route.method](route.path, route.handlers));

            methods.forEach(method => {
              it(`should redirect '${method.toUpperCase()}' requests and return the passed status code`, function(done) {
                request(app)[method]("/fromUri").expect(statusCode, done);
              });
            });
          });
        });

        describe("router.permanentRedirect(fromUri, toUri)", function() {
          const app = express();
          const router = Router.router();

          router.permanentRedirect("/here", "/there");
          router.apply(route => app[route.method](route.path, route.handlers));

          methods.forEach(method => {
            it(`should redirect '${method.toUpperCase()}' requests and return a 301 status code`, function(done) {
              request(app)[method]("/here").expect(301, done);
            });
          });
        });
      });
    });
  },
};
