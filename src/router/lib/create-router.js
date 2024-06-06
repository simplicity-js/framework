"use strict";

const path = require("path");
const laravelToExpress = require("./laravel-to-express");
const uriWithParams = require("./uri-with-params");

const defaultGroupOptions = {
  prefix: "/",
  middleware: [],
  namespace: "",
  patterns: {},
  meta: {}
};
const defaultRouteOptions = {
  method: "get",
  uri: "/",
  middleware: [],
  name: "",
  patterns: {},
  meta: {}
};
const proxy = {
  get(router, method) {
    let handler;

    if(method in router) {
      handler = router[method];
    } else {
      handler = function handleRequest(options, action) {
        if(typeof options === "string" || options instanceof String) {
          options = { uri: options };
        }

        options.method = method;
        router.route(options, action);
      };
    }

    return handler;
  },
};

module.exports = function createRouter(app, mapActionToHandler = (action) => action) {
  const namedUrls = {};
  const BACKSLASH_REGEX = /\\/g;

  class Router {
    constructor() {
      this.app = app;
      this.uris = [];
      this.middlewares = [];
      this.names = [];
      this.patterns = [];
      this.metas = [];
    }

    /**
     * Route (map) a request to a handler(s).
     *
     * @param {Object|String} options
     * @param {*} action
     * @return {Router}
     */
    route(options, action) {
      if(typeof options === "string" || options instanceof String) {
        options = { uri: options };
      }

      const routeOptions = Object.assign({}, defaultRouteOptions, options);

      routeOptions.method = routeOptions.method.toLowerCase();

      //const uri = path.join.apply(null, this.uris.concat(`/${routeOptions.uri}`));
      const uri = path.join.apply(null, this.uris.concat(`${routeOptions.uri}`)).replace(BACKSLASH_REGEX, "/");
      const middleware = this.middlewares.concat(routeOptions.middleware);
      const name = this.names.concat(routeOptions.name).join("");
      const patterns = Object.assign.apply(null, [{}].concat(this.patterns, routeOptions.patterns));
      const meta = Object.assign.apply(null, [{}].concat(this.metas, routeOptions.meta));

      const stack = middleware.concat(mapActionToHandler(action, {
        uri,
        middleware,
        name,
        patterns,
        meta
      }, routeOptions));

      if(routeOptions.name) {
        namedUrls[name] = {
          uri,
          patterns
        };
      }

      app[routeOptions.method](laravelToExpress(uri, patterns), stack);

      return this;
    }

    /**
     *
     * @param {Object|String} options
     * @param {Function} closure
     * @return {Router}
     */
    group(options, closure) {
      if(typeof options === "string" || options instanceof String) {
        options = {
          prefix: options
        };
      }

      const groupOptions = Object.assign({}, defaultGroupOptions, options);
      const router = new this.constructor(this);

      //router.uris = this.uris.concat(`/${groupOptions.prefix}`);
      router.uris = this.uris.concat(`${groupOptions.prefix}`).map(uri => uri.replace(BACKSLASH_REGEX, "/"));
      router.middlewares = this.middlewares.concat(groupOptions.middleware);
      router.names = this.names.concat(groupOptions.namespace);
      router.patterns = this.patterns.concat(groupOptions.patterns);
      router.metas = this.metas.concat(groupOptions.meta);

      if(!Proxy) {
        closure(router);
        return this;
      }

      closure(new Proxy(router, proxy));

      return this;
    }

    /**
     *
     * @param {string} uri
     * @param staticMiddleware
     * @return {Router}
     */
    serve(uri, staticMiddleware) {
      const url = path.join.apply(null, this.uris.concat(uri));
      const patterns = Object.assign.apply(null, [{}].concat(this.patterns));
      const stack = this.middlewares.concat(staticMiddleware);

      app.use(laravelToExpress(url, patterns), stack);

      return this;
    }

    /**
     *
     * @param {String} name
     * @param {Object} params
     * @param {Object} options
     * @return {String}
     */
    url(name, params = {}, options = {}) {
      const namedUrl = namedUrls[name];

      if(!namedUrl) {
        throw new Error(`No URL found for  "${name}"`);
      }

      const { uri, patterns } = namedUrl;

      return uriWithParams({ uri, params, patterns, options });
    }
  }

  const router = new Router();

  if(!Proxy) {
    return router;
  }

  return new Proxy(router, proxy);
};
