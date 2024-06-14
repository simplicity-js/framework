/* eslint-env node, mocha */

const NodeCache = require("node-cache");
const { chai } = require("../lib/test-helper");
const CacheServiceProvider = require("./cache-service-provider");

let expect;
let sp;
const cacheMethods = ["set", "get", "contains", "unset", "client"];
const config = {
  app: {
    name: "Simple Framework",
    version: "1.0.0",
  },
  cache: {
    stores: {
      file: {
        driver: "file",
        storagePath: "storage/cache/data",
      },

      memory: {
        driver: "memory",
        store: new NodeCache(),
      },

      redis: {
        driver: "redis",
      },
    },
  },
  get() {
    return this.cache;
  },
};

module.exports = {
  constructor() {
    describe("constructor(config)", function() {
      before(async function() {
        expect = (await chai()).expect;
        sp = new CacheServiceProvider(config);
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
          it("should bind a file-based cache into the service container if the default cache is 'file'", function() {
            const localConfig = {
              ...config,
              cache: {
                ...config.cache,
                default: "file",
              },
            };
            const serviceProvider = new CacheServiceProvider(localConfig);

            //expect(() => serviceProvider.container().resolve("cache")).to.throw(/Could not resolve 'cache'/);

            serviceProvider.register();

            expect(serviceProvider.container().resolve("cache")).to.be.an("object");
            expect(serviceProvider.container().resolve("cache").driver).to.equal("file");

            const cache = serviceProvider.container().resolve("cache");

            for(const method of cacheMethods) {
              expect(cache).to.have.property(method).to.be.a("function");
            }
          });

          it("should bind a memory-based cache into the service container if the default cache is 'memory'", function() {
            const localConfig = {
              ...config,
              cache: {
                ...config.cache,
                default: "memory",
              },
            };
            const serviceProvider = new CacheServiceProvider(localConfig);

            //expect(() => serviceProvider.container().resolve("cache")).to.throw(/Could not resolve 'cache'/);

            serviceProvider.register();

            expect(serviceProvider.container().resolve("cache")).to.be.an("object");
            expect(serviceProvider.container().resolve("cache").driver).to.equal("memory");

            const cache = serviceProvider.container().resolve("cache");

            for(const method of cacheMethods) {
              expect(cache).to.have.property(method).to.be.a("function");
            }
          });

          it("should bind a redis-based cache into the service container if the default cache is 'redis'", function() {
            const localConfig = {
              ...config,
              cache: {
                ...config.cache,
                default: "redis",
              },
            };
            const serviceProvider = new CacheServiceProvider(localConfig);

            //expect(() => serviceProvider.container().resolve("cache")).to.throw(/Could not resolve 'cache'/);

            serviceProvider.register();

            expect(serviceProvider.container().resolve("cache")).to.be.an("object");
            expect(serviceProvider.container().resolve("cache").driver).to.equal("redis");

            const cache = serviceProvider.container().resolve("cache");

            for(const method of cacheMethods) {
              expect(cache).to.have.property(method).to.be.a("function");
            }
          });
        });
      });
    });
  }
};
