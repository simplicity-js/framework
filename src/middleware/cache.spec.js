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
        describe("without arguments: createCacheMiddleware()", function() {
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
                  return false; // Test that it works with data compression disabled.
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

        describe("with an 'options' object argument: createCacheMiddleware({ duration: Number, predicate: Function })", function() {
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

          describe("middleware invocation", function() {
            let cache;
            let nextSpy;
            const nodeCache = new NodeCache();
            const message = "result of res.send() call";
            const config = {
              get(path) {
                if(path === "cache.compress") {
                  return true; // Test that it also works with data compression enabled.
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
              nextSpy = sinon.spy();
              cache = {
                ...nodeCache,
                set(key, value, options) {
                  if(options.duration) {
                    nodeCache.set(key, value, options.duration);
                  } else {
                    nodeCache.set(key, value);
                  }
                },
                contains(key) {
                  return nodeCache.has(key);
                },
                unset(key) {
                  return nodeCache.del(key);
                },
              };
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
              expect(nextSpy.calledTwice).to.be.false;
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

            it("should clear the cache if the 'predicate' function option returns true", async function() {
              let counter = 0;
              let response;
              const req = { ...reqObject };
              const res = { ...resObject, statusCode: 200 };

              // eslint-disable-next-line
              const predicate = (req, res) => {
                if(counter < 2) {
                  ++counter;
                  return true;
                } else {
                  return false;
                }
              };

              const midware = createCacheMiddleware({ predicate });

              // The predicate function is called and it increases counter to 1.
              response = await midware(req, res, nextSpy);

              // Assert that next was called.
              expect(nextSpy.calledOnce).to.be.true;

              // Assert that on the first call,
              // next, not the result of res.send, was invoked.
              expect(response).to.equal(undefined);

              // Invoke res.send().
              // This calls the re-defined res.send
              // which caches the result for future requests.
              res.send(message);

              // Call the middleware again.
              response = await midware(req, res, nextSpy);

              // The 'counter' variable is 1, it is still less than 2.
              // so the 'predicate' function returns true, and the cache is unset.
              // So res.send is re-defined to the version that caches its result
              // and 'next' is called a second time.
              //
              // Assert that next was called a second time.
              expect(nextSpy.calledTwice).to.be.true;

              // Assert that response is still undefined,
              // as the result of `send` was not cached and returned
              // when the middleware was invoked again.
              expect(response).to.equal(undefined);

              // Invoke res.send once more to cache the result for future requests.
              res.send(message);

              // Invoke the middleware again.
              // This time, the counter variable is incremented to 2
              // and the 'predicate' function returns false.
              // So, the middleware does NOT call next,
              // rather it (internally) takes our cached result
              // and passes it as an argument to res.send()
              // and then returns the result of res.send
              // resulting in our cached result being returned.
              response = await midware(req, res, nextSpy);

              // Assert that `next` was not called a third time
              expect(nextSpy.calledTwice).to.be.true;
              expect(nextSpy.calledThrice).to.be.false;
              expect(response).to.equal(message);
            });

            it("should clear the cache on expiry of the 'duration' option", async function() {
              this.timeout(10000); // Increase the timeout since we'll be doing some 'waiting'

              let response;
              const req = { ...reqObject };
              const res = { ...resObject, statusCode: 200 };
              const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
              const midware = createCacheMiddleware({ duration: 2 });

              response = await midware(req, res, nextSpy);

              // Assert that next was called.
              expect(nextSpy.calledOnce).to.be.true;

              // Assert that on the first call,
              // next, not the result of res.send, was invoked.
              expect(response).to.equal(undefined);

              // Invoke res.send().
              // This calls the re-defined res.send
              // which caches the result for 2 seconds for future requests
              // that take place within a 2-second window.
              res.send(message);

              // wait 2 seconds and call the middleware again.
              await sleep(2 * 1000);
              response = await midware(req, res, nextSpy);

              // 2 seconds have elapsed, so the cached data is unset.
              // res.send is re-defined to the version that caches its result
              // and 'next' is called a second time.
              //
              // Assert that next was called a second time.
              expect(nextSpy.calledTwice).to.be.true;

              // Assert that response is still undefined,
              // as the result of `send` was not cached and returned
              // when the middleware was invoked again.
              expect(response).to.equal(undefined);

              // Invoke res.send once more to cache the result for future requests
              // for a 2-second window.
              res.send(message);

              // Invoke the middleware again immediately before the 2-second expiration.
              // This time, the middleware does NOT call next,
              // rather it (internally) takes our cached result
              // and passes it as an argument to res.send()
              // and then returns the result of res.send
              // resulting in our cached result being returned.
              response = await midware(req, res, nextSpy);

              // Assert that `next` was not called a third time
              expect(nextSpy.calledTwice).to.be.true;
              expect(nextSpy.calledThrice).to.be.false;
              expect(response).to.equal(message);
            });
          });
        });
      });
    });
  },
};
