"use strict";

/* eslint-env node, mocha */

const http = require("node:http");
const express = require("express");
const request = require("supertest");
const { chai } = require("../../lib/test-helper");
const createCompressionMiddleware = require("./compression");

let expect;

function createServer(config, fn) {
  const app = express();
  const compression = createCompressionMiddleware(config);

  app.use(compression);
  app.get("*", function(req, res) {
    try {
      fn(req, res);
    } catch(err) {
      res.statusCode = err.status || 500;
      res.end(err.message);
    }
  });

  return http.createServer(app);
}

function shouldNotHaveHeader(header) {
  return function (res) {
    //assert.ok(!(header.toLowerCase() in res.headers), "should not have header " + header);
    // We can use expect here because by the time we call `expect(...)`,
    // expect would have already been initialized.
    // Thanks to closure, we can access its up-to-date (function) value.
    expect(res.headers).not.to.have.property(header.toLowerCase());
  };
}

describe("compressionMiddleware(options)", function() {
  before(async function() {
    expect = (await chai()).expect;
  });

  describe("options.types", function() {
    const tests = [
      {
        description: "should support an array of types",
        types: ["css", "html", "javascript", "json", "text"],
      },
      {
        description: "should support a space-delimited string",
        types: "css html javascript json text",
      },
      {
        description: "should support a comma-delimited string",
        types: "css,html,javascript,json,text",
      },
      {
        description: "should support a semi-colon-delimited string",
        types: "css;html;javascript;json;text",
      },
      {
        description: "should support a pipe-delimited string",
        types: "css|html|javascript|json|text",
      },
      {
        description: "should support a mix of supported delimiters",
        types: "css html,javascript;json|text",
      }
    ];

    tests.forEach(({ description, types }) => {
      const typesArray = Array.isArray(types)
        ? types
        : types.split(/[\s+,;|]+/).filter(Boolean);

      const config = {
        get() {
          return {
            types,
            threshold: 0,
          };
        },
      };

      typesArray.forEach(type => {
        let contentType;
        let response;

        switch(type) {
        case "css":
          contentType = "text/css";
          response = "<style type='text/css'></style>";
          break;

        case "html":
          contentType = "text/html";
          response = "<html><head><body>Sample text</body></head></html>";
          break;

        case "javascript":
          contentType = "application/javascript";
          response = "<script type='text/javascript'></script>";
          break;

        case "json":
          contentType = "application/json";
          response = "{ \"hello\": \"json-text\" }";

        case "text":
          contentType = "text/plain";
          response = "hello world";
          break;
        }

        it(`${description}: ${type} in focus`, function(done) {
          const server = createServer(config, function (req, res) {
            res.setHeader("Content-Type", contentType);
            res.end(response);
          });

          request(server)
            .get("/")
            .set("Accept-Encoding", "gzip")
            .expect("Content-Encoding", "gzip", done);
        });
      });
    });
  });

  describe("options.bypassHeader", function() {
    const options = {
      threshold: 0,
      types: ["css", "html", "javascript", "json", "text"],
    };

    it("should not compress responses with the specified header", function(done) {
      const config = { get: () => ({ ...options, bypassHeader: "x-no-compress"}) };
      const server = createServer(config, function (req, res) {
        res.setHeader("Content-Type", "text/plain");
        res.end("hello world!");
      });

      request(server)
        .get("/")
        .set("Accept-Encoding", "gzip")
        .set("x-no-compress", "true")
        .expect(shouldNotHaveHeader("Content-Encoding"))
        .expect(200, done);
    });

    it("should compress response if set to a falsy value", function(done) {
      const config = { get: () => ({ ...options, bypassHeader: null }) };
      const server = createServer(config, function (req, res) {
        res.setHeader("Content-Type", "text/plain");
        res.end("hello world!");
      });

      request(server)
        .get("/")
        .set("Accept-Encoding", "gzip")
        .set("x-no-compress", "true")
        .expect("Content-Encoding", "gzip", done);
    });
  });

  describe("options.disable", function() {
    const options = {
      threshold: 0,
      bypassHeader: "x-no-compress",
      types: ["css", "html", "javascript", "json", "text"],
    };

    it("should not compress response if true", function(done) {
      const config = { get: () => ({ ...options, disable: true }) };
      const server = createServer(config, function (req, res) {
        res.setHeader("Content-Type", "text/plain");
        res.end("hello world!");
      });

      request(server)
        .get("/")
        .set("Accept-Encoding", "gzip")
        .expect(shouldNotHaveHeader("Content-Encoding"))
        .expect(200, done);
    });

    it("should compress response if false", function(done) {
      const config = { get: () => ({ ...options, disable: false }) };
      const server = createServer(config, function (req, res) {
        res.setHeader("Content-Type", "text/plain");
        res.end("hello world!");
      });

      request(server)
        .get("/")
        .set("Accept-Encoding", "gzip")
        .expect("Content-Encoding", "gzip", done);
    });
  });
});
