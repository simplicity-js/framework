/* eslint-env node, mocha */

const { chai } = require("../../lib/test-helper");
const config = require("../test-mocks/config");
const createApp = require("./app");


let expect;
const routerMethods = ["route", "group", "serve", "url", "apply"];

const httpMethods = [
  "checkout",
  "copy",
  "delete",
  "get",
  "head",
  "lock",
  "merge",
  "mkactivity",
  "mkcol",
  "move",
  "m-search",
  "notify",
  "options",
  "patch",
  "post",
  "purge",
  "put",
  "report",
  "search",
  "subscribe",
  "trace",
  "unlock",
  "unsubscribe"
];


/*
 * Assert the options injected into (web and api) route groups by the app.
 */
function assertRouteGroupOptions(options) {
  expect(options).to.be.an("object");
  expect(options).to.have.property("router").to.be.an("object");
  expect(options).to.have.property("download").to.be.a("function");
  expect(options).to.have.property("view").to.be.a("function");

  for(const method of routerMethods) {
    expect(options.router).to.have.property(method).to.be.a("function");
  }

  for(const verb of httpMethods) {
    expect(typeof options.router[verb]).to.equal("function");
  }
}

module.exports = {
  createApp() {
    describe("createApp", function createApp_Spec() {
      before(async function() {
        expect = (await chai()).expect;
      });

      it("should throw if a 'config' object with a 'get' method is not given", function() {
        const expectedErrorMessage = "createApp 'options' object expects " +
        "a 'config' object with a 'get' method.";

        expect(createApp.bind(null, null)).to.throw(expectedErrorMessage);
        expect(createApp.bind(null, {})).to.throw(expectedErrorMessage);
      });

      it("should throw if a 'providers' array is not given", function() {
        const expectedErrorMessage = "createApp 'options' object expects a 'providers' array.";

        expect(createApp.bind(null, {
          config, providers: "providers", webRouter: () => {}, apiRouter: () => {}
        })).to.throw(expectedErrorMessage);

        expect(createApp.bind(null, {
          config, providers: 100, webRouter: () => {}, apiRouter: () => {}
        })).to.throw(expectedErrorMessage);

        expect(createApp.bind(null, {
          config, providers: {}, webRouter: () => {}, apiRouter: () => {}
        })).to.throw(expectedErrorMessage);

        expect(createApp.bind(null, {
          config, providers: [], webRouter: () => {}, apiRouter: () => {}
        })).not.to.throw();
      });

      it("should throw if none of `webRouter` or `apiRouter` function arguments are given", function() {
        const expectedErrorMessage = "createApp 'options' object expects either or both of " +
        "the following function members: `webRouter`, `apiRouter`.";

        expect(createApp.bind(null, { config, providers: [] })).to.throw(expectedErrorMessage);
        expect(createApp.bind(null, { config, providers: [], webRouter: {}, apiRouter: {} })).to.throw(expectedErrorMessage);
      });

      it("should accept a `webRouter` function property and inject a `config` object", function() {
        createApp({ config, providers: [], webRouter: function(options) {
          assertRouteGroupOptions(options);
        }});
      });

      it("should accept an `apiRouter` function property and inject a `config` object", function() {
        createApp({ config, providers: [], apiRouter: function(options) {
          assertRouteGroupOptions(options);
        }});
      });

      it("should return an Express app that doubles as a DI Container", function() {
        const app = createApp({ config, providers: [], webRouter: function() {} });

        const expressAppMethods = ["get", "listen", "set", "use"];
        const diContainerMethods = ["bind", "instance", "value", "resolve"];

        for(const method of expressAppMethods) {
          expect(app).to.have.property(method).to.be.a("function");
        }

        for(const method of diContainerMethods) {
          expect(app).to.have.property(method).to.be.a("function");
        }
      });
    });
  },
};
