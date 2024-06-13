/* eslint-env node, mocha */

const NodeCache = require("node-cache");
const sinon = require("sinon");
const { chai } = require("../lib/test-helper");
const createCacheMiddleware = require("./cache");


let expect;


module.exports = {
  create() {
    describe("createCacheMiddleware(options)", function() {
      before(async function() {
        expect = (await chai()).expect;
      });

      describe("middleware creation", function() {
        describe("without arguments", function() {
          let mware;

          beforeEach(function() {
            mware = createCacheMiddleware();
          });

          it("should return a middleware function", function() {
            expect(mware).to.be.a("function");
          });

          it("should accept three arguments", function() {
            expect(mware.length).to.equal(3);
          });

          describe("middleware invocation", function() {
            let cache;
            let nextSpy;
            const message = "result of res.send() call";
            const config = {
              get(path) {
                if(path === "cache.compress") {
                  return false;
                }
              }
            };
            const reqObject = {
              app: {
                resolve(path) {
                  if(path === "cache") {
                    return cache;
                  }

                  if(path === "config") {
                    return config;
                  }
                },
              },
              path: "/test",
              query: { cacheTest: true },
              body: {}
            };
            const resObject = {
              send(data) {
                return data;
              },
            };

            beforeEach(function() {
              cache = new NodeCache();
              nextSpy = sinon.spy();
            });

            afterEach(function() {
              cache.flushAll();
              cache.close();
            });

            it("should call next() on the first invocation, cache the response, and use it on subsequent invocations", async function() {
              let response;
              const req = { ...reqObject };
              const res = { ...resObject, statusCode: 200 };

              // Re-defines `res.send` with the ability to cache the response,
              // and calls `next`.
              response = await mware(req, res, nextSpy);

              // Assert that next was called.
              expect(nextSpy.calledOnce).to.be.true;

              // Assert that on the first call,
              // next, not the result of res.send, was invoked.
              expect(response).to.equal(undefined);

              // Invoke res.send().
              // This calls the re-defined res.send
              // which is able to cache the result for future requests.
              res.send(message);

              // Call the middleware again.
              // This time, it does NOT call next,
              // rather it (internally) takes our cached result
              // and passes it as an argument to res.send()
              // and the returns the result of res.send
              // resulting in our cached result being returned.
              response = await mware(req, res, nextSpy);

              // Assert that `next` was not called a second time
              expect(nextSpy.calledOnce).to.be.true;
              expect(response).to.equal(message);
            });

            it("should not cache non-success responses (HTTP status code outside the 2xx range)", async function() {
              let response;
              const req = { ...reqObject };
              const res = { ...resObject, statusCode: 400 };

              response = await mware(req, res, nextSpy);

              // Assert that next was called.
              expect(nextSpy.calledOnce).to.be.true;

              // Assert that on the first call,
              // next, not the result of res.send, was invoked.
              expect(response).to.equal(undefined);

              // Invoke res.send().
              // For success responses, this calls the re-defined res.send
              // which is able to cache the result for future requests.
              // But for our case, a non-success responses, it does no caching.
              res.send(message);

              // Call the middleware again.
              response = await mware(req, res, nextSpy);

              // Assert that next was called a second time.
              expect(nextSpy.calledTwice).to.be.true;

              // Assert that response is still undefined,
              // as the result of `send` was not cached and returned
              // when the middleware was invoked again.
              expect(response).to.equal(undefined);
            });
          });
        });

        describe("with an 'options' argument", function() {
          let mware;

          beforeEach(function() {
            const predicate = () => {};
            mware = createCacheMiddleware({ duration: 5, predicate });
          });

          it("should return a middleware function", function() {
            expect(mware).to.be.a("function");
          });

          it("should accept three arguments", function() {
            expect(mware.length).to.equal(3);
          });
        });
      });
    });
  },
};
