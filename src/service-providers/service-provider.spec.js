/* eslint-env node, mocha */

const { chai } = require("../lib/test-helper");
const ServiceProvider = require("./service-provider");

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
        sp = new ServiceProvider(config);
      });

      it("should initialize and return an object", function() {
        expect(sp).to.be.an("object");
      });

      describe("provider object", function() {
        it("should have a 'container' method that returns the service container", function() {
          expect(sp).to.be.an("object");
          expect(sp).to.have.property("container").to.be.a("function");

          for(const method of ["bind", "instance", "value", "resolve"]) {
            expect(sp.container()).to.have.property(method).to.be.a("function");
          }
        });

        it("should have a 'config' method that returns the passed 'config'", function() {
          expect(sp).to.be.an("object");
          expect(sp).to.have.property("config").to.be.a("function");
          expect(sp.config()).to.deep.equal(config);
        });
      });
    });
  }
};
