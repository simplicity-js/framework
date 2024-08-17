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
          it(`successfully routes to ${method} requests`, function(done) {
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
          const userController = {
            index: (req, res) => res.send("show users listing"),
            new: (req, res) => res.send("display user creation form"),
            create: (req, res) => res.send("create new user"),
            show: (req, res) => res.send("show user details"),
            edit: (req, res) => res.send("display user edit form"),
            update: (req, res) => res.send("update user data"),
            destroy: (req, res) => res.send("delete user"),
          };

          router.controller(userController, (router) => {
            router.get("/users", "index");
            router.get("/users/new", "new");
            router.post("/users", "create");
            router.get("/users/{id}", "show");
            router.get("/users/{id}/edit", "edit");
            router.put("/users/{id}", "update");
            router.patch("/users/:id", "update");
            router.delete("/users/{id}", "destroy");
          });

          const expectations = [
            { uri: "/users",        method: "get",    response: "show users listing" },
            { uri: "/users/new",    method: "get",    response: "display user creation form" },
            { uri: "/users",        method: "post",   response: "create new user" },
            { uri: "/users/1",      method: "get",    response: "show user details" },
            { uri: "/users/1/edit", method: "get",    response: "display user edit form" },
            { uri: "/users/1",      method: "put",    response: "update user data" },
            { uri: "/users/1",      method: "patch",  response: "update user data" },
            { uri: "/users/1",      method: "delete", response: "delete user" },
          ];

          router.apply(route => app[route.method](route.path, route.handlers));

          expectations.forEach(({ uri, method, response }) => {
            it(`should apply controller method to route ${method}::${uri}`, function(done) {
              const currRequest = request(app)[method](uri);

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
            { uri: "/posts",        method: "get",    response: "show posts listing" },
            { uri: "/posts/new",    method: "get",    response: "display post creation form" },
            { uri: "/posts",        method: "post",   response: "create new post" },
            { uri: "/posts/1",      method: "get",    response: "show post details" },
            { uri: "/posts/1/edit", method: "get",    response: "display post edit form" },
            { uri: "/posts/1",      method: "put",    response: "update post data" },
            { uri: "/posts/1",      method: "patch",  response: "update post data" },
            { uri: "/posts/1",      method: "delete", response: "delete post" },
          ];

          router.apply(route => app[route.method](route.path, route.handlers));

          expectations.forEach(({ uri, method, response }) => {
            it(`should create ${method}::${uri} route for passed resource ('posts')`, function(done) {
              const currRequest = request(app)[method](uri);

              currRequest.expect(200, response);
              currRequest.end(done);
            });
          });
        });
      });
    });
  },
};
