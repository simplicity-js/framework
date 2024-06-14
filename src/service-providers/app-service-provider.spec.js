/* eslint-env node, mocha */

const { chai } = require("../lib/test-helper");
const AppServiceProvider = require("./app-service-provider");

let expect;
let sp;
const config = {
  app: {
    name: "Simple Framework",
    version: "1.0.0",
  },
};

module.exports = {
  constructor() {
    describe("constructor(config)", function() {
      before(async function() {
        expect = (await chai()).expect;
        sp = new AppServiceProvider(config);
      });

      it("should initialize and return an object", function() {
        expect(sp).to.be.an("object");
      });

      describe("provider object", function() {
        it("should have a 'container' method that returns the service container", function() {
          expect(sp).to.be.an("object");
          expect(sp).to.have.property("container").to.be.a("function");

          for(const method of ["bindWithClass", "bindWithFunction", "resolve"]) {
            expect(sp.container()).to.have.property(method).to.be.a("function");
          }
        });

        it("should have a 'config' method that returns the passed 'config'", function() {
          expect(sp).to.be.an("object");
          expect(sp).to.have.property("config").to.be.a("function");
          expect(sp.config()).to.deep.equal(config);
        });

        it("should have a 'register' method that binds values into the container", function() {
          expect(sp).to.be.an("object");
          expect(sp).to.have.property("register").to.be.a("function");
        });

        describe(".register()", function() {
          it("should bind the 'config' and 'registry' into the service container", function() {
            //expect(() => sp.container().resolve("config")).to.throw(/Could not resolve 'config'/);
            //expect(() => sp.container().resolve("registry")).to.throw(/Could not resolve 'registry'/);

            sp.register();

            expect(sp.container().resolve("config")).to.deep.equal(config);

            const registry = sp.container().resolve("registry");
            const registryMethods = ["add", "contains", "get", "remove"];

            for(const method of registryMethods) {
              expect(registry).to.have.property(method).to.be.a("function");
            }
          });
        });
      });
    });
  }
};
