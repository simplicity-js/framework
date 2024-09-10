"use strict";

const chai = () => import("chai").then(chai => chai);
const createValidationMiddleware = require("./validation");

let expect;


describe("createValidationMiddleware()", function() {
  before(async function() {
    expect = (await chai()).expect;
  });

  describe("middleware creation", function() {
    it("should return a middleware function that accepts three arguments", function() {
      const vmware = createValidationMiddleware();

      expect(vmware).to.be.a("function");
      expect(vmware.length).to.equal(3);
    });
  });

  describe("middleware invocation", function() {
    let vmware;
    const req = {};
    const res = {};

    before(function(done) {
      vmware = createValidationMiddleware();
      done();
    });

    it("should augment the `req` object with `data`, `input`, and `validate` members", function(done) {
      expect(req).not.to.have.property("data");
      expect(req).not.to.have.property("input");
      expect(req).not.to.have.property("validate");

      vmware(req, res, () => {});

      expect(req).to.have.property("data").to.be.an("object");
      expect(req).to.have.property("input").to.be.a("function");
      expect(req).to.have.property("validate").to.be.a("function");

      done();
    });
  });

  describe("augmentedRequestMethods", function() {
    let vmware;
    const req = {
      body: { route: "users" },
      params: { id: 1 },
      query: { firstname: "Michael" },
    };
    const res = {
      locals: {},
      json(data) {
        this.data = data;
      },
      status(status) {
        this.statusCode = status;

        return this;
      },
    };

    beforeEach(function(done) {
      vmware = createValidationMiddleware();
      vmware(req, res, () => {});
      done();
    });

    describe("req.data", function() {
      it("should read all request data from `body`, `params`, and `query`", function(done) {
        expect(req.data).to.deep.equal({ route: "users", id: 1, firstname: "Michael" });
        done();
      });

      it("should read individual request input data from `body`, `params`, and `query`", function(done) {
        expect(req.data.route).to.equal("users");
        expect(req.data.id).to.equal(1);
        expect(req.data.firstname).to.equal("Michael");
        done();
      });
    });

    describe("req.input([field])", function() {
      it("should return all request data from `body`, `params`, and `query` if no field is specified", function(done) {
        expect(req.input()).to.deep.equal({ route: "users", id: 1, firstname: "Michael" });
        done();
      });

      it("should return the specified input field value from `body`, `params`, or `query`", function(done) {
        expect(req.input("route")).to.equal("users");
        expect(req.input("id")).to.equal(1);
        expect(req.input("firstname")).to.equal("Michael");
        done();
      });
    });

    describe("req.validate(fieldRules)", function() {
      const validatedRequestMethods = ["get", "has", "contains", "includes"];
      const tests = [
        {
          description: "should add a `ValidationError` object to `res.errors' for JSON requests",
          contentType: "application/json",
          requestType: "json",
          rules: {
            title: ["required", "max:255"]
          },
          expectation: {
            ValidationError: {
              title: [
                "The title field is required."
              ],
            }
          },
        },
        {
          description: "should add a `ValidationError` object to `res.errors' for plain-text requests",
          contentType: "text/plain",
          requestType: "text",
          rules: {
            email: { type: "email" },
          },
          expectation: {
            ValidationError: {
              email: ["The email must be a valid email address." ]
            },
          },
        },
        {
          description: "should add a `ValidationError` object to `res.errors' for JavaScript requests",
          contentType: "application/javascript",
          requestType: "javascript",
          rules: {
            id: "alpha|length:6-",
            route: "alpha|uppercase",
            firstname: { type: "number" },
          },
          expectation: {
            ValidationError: {
              firstname: [
                "The firstname must consist of only numbers.",
              ],
              id: [
                "The id must consist of only alphabets, underscores, and dashes.",
                "The id must be at least 6 characters long.",
              ],
              route: [
                "The route must consist of only uppercase characters.",
              ],
            }
          },
        },
        {
          description: "should add a `ValidationError` object to `res.errors' for unknown requests",
          contentType: "",
          requestType: "unknown",
          rules: {
            password: ["required", "max:255"]
          },
          expectation: {
            ValidationError: {
              password: [
                "The password field is required."
              ],
            }
          },
        },
        {
          description: "should add a `ValidationError` object to `res.locals.errors' for FORM requests",
          contentType: "application/x-www-form-urlencoded",
          requestType: "form",
          rules: {
            lastname: "required,alpha;min:3|max:20",
          },
          expectation: {
            ValidationError: {
              lastname: [
                "The lastname field is required.",
              ]
            },
          },
        },
        {
          description: "should add a `ValidationError` object to `res.locals.errors' for UPLOAD requests",
          contentType: "multipart/form-data; boundary=xhysaklasuytlalsglaslalslwlsl...",
          requestType: "upload",
          rules: {
            lastname: "required,alpha;min:3|max:20",
          },
          expectation: {
            ValidationError: {
              lastname: [
                "The lastname field is required.",
              ]
            },
          },
        },
      ];

      beforeEach(function(done) {
        res.locals = {};
        delete res.errors;
        done();
      });

      it("should return an object with methods for reading validated info", function(done) {
        req.get = () => "application/json";

        const rules = {
          id: "required|number",
          route: "alpha|lowercase",
          firstname: { type: "alpha" },
        };
        const validated = req.validate(rules);

        expect(validated).to.be.an("object");

        validatedRequestMethods.forEach(method => {
          expect(validated).to.have.property(method).to.be.a("function");
        });

        done();
      });

      tests.forEach(({ contentType, requestType, description, rules, expectation }) => {
        function assertValidationError(expectedError, returnedError) {
          expect(returnedError).to.have.property("ValidationError");

          for(const [prop, value] of Object.entries(expectedError)) {
            expect(returnedError.ValidationError).to.have.property(prop);
            expect(returnedError.ValidationError[prop]).to.deep.equal(value);
          }

          validatedRequestMethods.forEach(method => {
            expect(returnedError.ValidationError).to.have.property(method)
              .to.be.a("function");
          });
        }

        it(description, function(done) {
          req.get = () => contentType;

          const validated = req.validate(rules);
          const validationErrors = expectation.ValidationError;

          expect(validated).to.be.an("object");

          validatedRequestMethods.forEach(method => {
            expect(validated).to.have.property(method).to.be.a("function");
          });

          if(["javascript", "json", "text", "unknown"].includes(requestType)) {
            expect(res).to.have.property("errors").to.be.an("object");
            assertValidationError(validationErrors, res.errors);
          } else if(["form", "upload"].includes(requestType)){
            expect(res.locals).to.have.property("errors").to.be.an("object");
            assertValidationError(validationErrors, res.locals.errors);
          }

          done();
        });
      });

      it("should throw a 'ValidationError' if we try to read request data from failing validation", function(done) {
        req.get = () => "json";
        const errorName = "ValidationError";
        const validationError = {
          firstname: [
            "The firstname must consist of only numbers.",
          ],
          id: [
            "The id must consist of only alphabets, underscores, and dashes.",
            "The id must be at least 6 characters long.",
          ],
          route: [
            "The route must consist of only uppercase characters.",
          ],
        };

        const validated = req.validate({
          id: "alpha|length:6-",
          route: "alpha|uppercase",
          firstname: { type: "number" },
        });

        function assertThrownError(expectedError, thrownError) {
          for(const [prop, value] of Object.entries(expectedError)) {
            expect(thrownError).to.have.property(prop);
            expect(thrownError[prop]).to.deep.equal(value);
          }

          validatedRequestMethods.forEach(method => {
            expect(thrownError).to.have.property(method).to.be.a("function");
          });
        }

        try {
          validated.id;
          expect(false).to.equal(true); // demonstrate that execution does not get here
        } catch(err) {
          expect(err.name).to.equal(errorName);
          assertThrownError(validationError, err.errors);
        }

        try {
          validated.get("route");
        } catch(err) {
          expect(err.name).to.equal(errorName);
          assertThrownError(validationError, err.errors);
        }

        done();
      });

      it("should pass validation for proper requests", function(done) {
        req.get = () => "json";

        const validated = req.validate({
          id: "required|number",
          route: "alpha|lowercase",
          firstname: { type: "alpha" },
        });

        expect(validated).to.be.an("object");

        validatedRequestMethods.forEach(method => {
          expect(validated).to.have.property(method).to.be.a("function");
        });

        expect(res.errors).to.equal(undefined);
        expect(res.locals.errors).to.equal(undefined);

        for(const field of ["id", "route", "firstname"]) {
          expect(validated[field]).to.equal(validated.get(field));
          expect(validated[field]).to.equal(req.input(field));
        }

        expect(validated.id).to.equal(req.params.id);
        expect(validated.users).to.equal(req.body.users);
        expect(validated.firstname).to.equal(req.query.firstname);

        done();
      });
    });
  });
});
