/* eslint-env node, mocha */

const { chai } = require("./lib/test-helper");
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

const HTTP_STATUS_CODES = {
  HTTP_CONTINUE: 100,
  HTTP_SWITCHING_PROTOCOLS: 101,
  HTTP_PROCESSING: 102,
  HTTP_EARLY_HINTS: 103,
  HTTP_OK: 200,
  HTTP_CREATED: 201,
  HTTP_ACCEPTED: 202,
  HTTP_NON_AUTHORITATIVE_INFORMATION: 203,
  HTTP_NO_CONTENT: 204,
  HTTP_RESET_CONTENT: 205,
  HTTP_PARTIAL_CONTENT: 206,
  HTTP_MULTI_STATUS: 207,
  HTTP_ALREADY_REPORTED: 208,
  HTTP_IM_USED: 226,
  HTTP_MULTIPLE_CHOICES: 300,
  HTTP_MOVED_PERMANENTLY: 301,
  HTTP_FOUND: 302,
  HTTP_SEE_OTHER: 303,
  HTTP_NOT_MODIFIED: 304,
  HTTP_USE_PROXY: 305,
  HTTP_RESERVED: 306,
  HTTP_TEMPORARY_REDIRECT: 307,
  HTTP_PERMANENTLY_REDIRECT: 308,
  HTTP_BAD_REQUEST: 400,
  HTTP_UNAUTHORIZED: 401,
  HTTP_PAYMENT_REQUIRED: 402,
  HTTP_FORBIDDEN: 403,
  HTTP_NOT_FOUND: 404,
  HTTP_METHOD_NOT_ALLOWED: 405,
  HTTP_NOT_ACCEPTABLE: 406,
  HTTP_PROXY_AUTHENTICATION_REQUIRED: 407,
  HTTP_REQUEST_TIMEOUT: 408,
  HTTP_CONFLICT: 409,
  HTTP_GONE: 410,
  HTTP_LENGTH_REQUIRED: 411,
  HTTP_PRECONDITION_FAILED: 412,
  HTTP_REQUEST_ENTITY_TOO_LARGE: 413,
  HTTP_REQUEST_URI_TOO_LONG: 414,
  HTTP_UNSUPPORTED_MEDIA_TYPE: 415,
  HTTP_REQUESTED_RANGE_NOT_SATISFIABLE: 416,
  HTTP_EXPECTATION_FAILED: 417,
  HTTP_I_AM_A_TEAPOT: 418,
  HTTP_MISDIRECTED_REQUEST: 421,
  HTTP_UNPROCESSABLE_ENTITY: 422,
  HTTP_LOCKED: 423,
  HTTP_FAILED_DEPENDENCY: 424,
  HTTP_TOO_EARLY: 425,
  HTTP_UPGRADE_REQUIRED: 426,
  HTTP_PRECONDITION_REQUIRED: 428,
  HTTP_TOO_MANY_REQUESTS: 429,
  HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  HTTP_UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  HTTP_INTERNAL_SERVER_ERROR: 500,
  HTTP_NOT_IMPLEMENTED: 501,
  HTTP_BAD_GATEWAY: 502,
  HTTP_SERVICE_UNAVAILABLE: 503,
  HTTP_GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  HTTP_VARIANT_ALSO_NEGOTIATES_EXPERIMENTAL: 506,
  HTTP_INSUFFICIENT_STORAGE: 507,
  HTTP_LOOP_DETECTED: 508,
  HTTP_NOT_EXTENDED: 510,
  HTTP_NETWORK_AUTHENTICATION_REQUIRED: 511,
};

const HTTP_STATUS_TEXTS = [
  [100, "Continue"],
  [101, "Switching Protocols"],
  [102, "Processing"],
  [103, "Early Hints"],
  [200, "OK"],
  [201, "Created"],
  [202, "Accepted"],
  [203, "Non-Authoritative Information"],
  [204, "No Content"],
  [205, "Reset Content"],
  [206, "Partial Content"],
  [207, "Multi-Status"],
  [208, "Already Reported"],
  [226, "IM Used"],
  [300, "Multiple Choices"],
  [301, "Moved Permanently"],
  [302, "Found"],
  [303, "See Other"],
  [304, "Not Modified"],
  [305, "Use Proxy"],
  [307, "Temporary Redirect"],
  [308, "Permanent Redirect"],
  [400, "Bad Request"],
  [401, "Unauthorized"],
  [402, "Payment Required"],
  [403, "Forbidden"],
  [404, "Not Found"],
  [405, "Method Not Allowed"],
  [406, "Not Acceptable"],
  [407, "Proxy Authentication Required"],
  [408, "Request Timeout"],
  [409, "Conflict"],
  [410, "Gone"],
  [411, "Length Required"],
  [412, "Precondition Failed"],
  [413, "Content Too Large"],
  [414, "URI Too Long"],
  [415, "Unsupported Media Type"],
  [416, "Range Not Satisfiable"],
  [417, "Expectation Failed"],
  [418 , "I'm a teapot"],
  [421, "Misdirected Request"],
  [422, "Unprocessable Content"],
  [423, "Locked"],
  [424, "Failed Dependency"],
  [425, "Too Early"],
  [426, "Upgrade Required"],
  [428, "Precondition Required"],
  [429, "Too Many Requests"],
  [431, "Request Header Fields Too Large"],
  [451, "Unavailable For Legal Reasons"],
  [500, "Internal Server Error"],
  [501, "Not Implemented"],
  [502, "Bad Gateway"],
  [503, "Service Unavailable"],
  [504, "Gateway Timeout"],
  [505, "HTTP Version Not Supported"],
  [506, "Variant Also Negotiates"],
  [507, "Insufficient Storage"],
  [508, "Loop Detected"],
  [510, "Not Extended"],
  [511, "Network Authentication Required"],
];


/*
 * Assert the options injected into (web and api) route groups by the app.
 */
function assertRouteGroupOptions(options) {
  expect(options).to.be.an("object");
  expect(options).to.have.property("router").to.be.an("object");
  expect(options).to.have.property("download").to.be.a("function");
  expect(options).to.have.property("view").to.be.a("function");
  expect(options).to.have.property("STATUS_CODES").to.be.an("object");
  expect(options).to.have.property("STATUS_TEXTS").to.be.an("object");

  for(const method of routerMethods) {
    expect(options.router).to.have.property(method).to.be.a("function");
  }

  for(const verb of httpMethods) {
    expect(typeof options.router[verb]).to.equal("function");
  }

  for(const [key, value] of Object.entries(HTTP_STATUS_CODES)) {
    expect(options.STATUS_CODES).to.have.property(key, value);
  }

  for(const element of HTTP_STATUS_TEXTS) {
    const [key, value] = element;

    expect(options.STATUS_TEXTS).to.have.property(key, value);
  }
}

module.exports = {
  createApp() {
    describe("createApp", function createApp_Spec() {
      before(async function() {
        expect = (await chai()).expect;
      });

      it("should throw if none of `webRouter` or `apiRouter` functions are given", function() {
        const expectedErrorMessage = "createApp 'options' object expects either or both of " +
        "the following function members: `webRouter`, `apiRouter`.";

        expect(createApp.bind(null, {})).to.throw(expectedErrorMessage);
        expect(createApp.bind(null, { webRouter: {}, apiRouter: {} })).to.throw(expectedErrorMessage);
      });

      it("should accept a `webRoutes` function property and inject a `config` object", function() {
        createApp({ webRouter: function(options) {
          assertRouteGroupOptions(options);
        }});
      });

      it("should accept an `apiRoutes` function property and inject a `config` object", function() {
        createApp({ webRouter: function(options) {
          assertRouteGroupOptions(options);
        }});
      });

      it("should return an Express app that doubles as a DI Container", function() {
        const app = createApp({ webRouter: function() {} });

        const expressAppMethods = ["get", "listen", "set", "use"];
        const diContainerMethods = ["bindWithClass", "bindWithFunction", "resolve"];

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
