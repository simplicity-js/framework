/* eslint-env node, mocha */

const container = require("../../component/container");
const { chai } = require("../../lib/test-helper");
const config = require("../test-mocks/src/config");
const createApp = require("./app");

let expect;

module.exports = {
  createApp() {
    describe("createApp", function createApp_Spec() {
      before(async function() {
        expect = (await chai()).expect;
      });

      it("should throw if a 'config' object with a 'get' method is not passed", function() {
        const expectedErrorMessage = "createApp 'options' object expects " +
        "a 'config' object with a 'get' method.";

        expect(createApp.bind(null, null)).to.throw(expectedErrorMessage);
        expect(createApp.bind(null, {})).to.throw(expectedErrorMessage);
      });

      it("should throw if an instance of 'Container' is not passed", function() {
        const routes = [];
        const expectedErrorMessage = "createApp 'options' object expects a 'Container' instance.";

        expect(createApp.bind(null, {
          config,
          container: null,
          providers: [],
          routes: {
            web: { routes },
            api: { routes }
          },
        })).to.throw(expectedErrorMessage);

        expect(createApp.bind(null, {
          config,
          container: {},
          providers: [],
          routes: {
            web: { routes },
            api: { routes }
          },
        })).to.throw(expectedErrorMessage);
      });

      it("should throw if a of `routes` object is not given", function() {
        const expectedErrorMessage = "" +
        "createApp 'options' object expects a 'routes' object " +
        "with either or both of the following members: `web`, `api` " +
        "that must have a 'routes' array member.";

        expect(createApp.bind(null, { config, container, providers: [] }))
          .to.throw(expectedErrorMessage);
      });

      it("should throw if none of `web` or `api` routes members are given", function() {
        const expectedErrorMessage = "" +
        "createApp 'options' object expects a 'routes' object " +
        "with either or both of the following members: `web`, `api` " +
        "that must have a 'routes' array member.";

        expect(createApp.bind(null, { config, container }))
          .to.throw(expectedErrorMessage);
        expect(createApp.bind(null, { config, container, routes: {} }))
          .to.throw(expectedErrorMessage);
      });

      it("should return an Express app that doubles as a DI Container", function() {
        const app = createApp({
          config,
          container,
          routes: {
            web: { prefix: "/",    router: { routes: [] } },
            api: { prefix: "/api", router: { routes: [] } },
          },
        });

        const expressAppMethods = ["get", "listen", "set", "use"];
        const diContainerMethods = ["bind", "instance", "instantiate", "value", "resolve"];

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
