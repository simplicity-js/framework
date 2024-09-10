"use strict";

const { validate: validateAlpha } = require("../alpha-validator");
const { chai } = require("./test-helpers");

let expect;
const rule = { type: "alpha" };


describe("alphaValidator(value, rule)", function() {
  before(async function() {
    expect = (await chai()).expect;
  });

  const failingTests = [
    {
      description: "should fail if value is undefined, null, false, or an empty string",
      testData: [undefined, null, false, ""],
      rule: rule
    },
    {
      description: "should fail if value contains other character except A - Z, _, or -",
      testData: ["hero_$", "J0hn"],
      rule: rule,
    },
    {
      description: "should fail if value contains whitespace character",
      testData: ["Jane doe"],
      rule: rule,
    },
    {
      description: "should fail if value is less than minimum specified length",
      testData: ["John"],
      rule: {
        ...rule,
        length: { min: 5 }
      },
    },
    {
      description: "should fail if value is greater than the maximum specified length",
      testData: ["James"],
      rule: {
        ...rule,
        length: { max: 4 },
      },
    },
    {
      description: "should fail if value is not between minimim and maximum specified length (inclusive)",
      testData: ["Tom", "Andrew"],
      rule: {
        ...rule,
        length: { min: 4, max: 5 }
      }
    },
    {
      description: "should treat a length value of number as the exact length (failing)",
      testData: ["Gregory", "John", "Tom", "Andrew"],
      rule:  { ...rule, length: 5 }
    },
  ];

  const passingTests = [
    {
      description: "should allow whitespace character if `rule.allowWhitespace` is true",
      testData: ["Jane doe"],
      rule: { ...rule, allowWhitespace: true },
    },
    {
      description: "should pass if value contains only A - Z, _, or -",
      testData: ["John", "John_", "_John_", "Jo-h-n-", "-Jo-h-n", "-Jo-h-n-"],
      rule: rule,
    },
    {
      description: "should match any arbitrary length string if no length is given",
      testData: ["ThisShouldBeAStringOfVeryLongLengthWithoutWhitespaceThatShouldBeValidatedAgainst"],
      rule: rule,
    },
    {
      description: "should pass if value is at least the minimum specified length",
      testData: ["James"],
      rule: {
        ...rule,
        length: { min: 5 }
      },
    },
    {
      description: "should pass if value is at most the maximum specified length",
      testData: ["John"],
      rule: {
        ...rule,
        length: { max: 4 }
      },
    },
    {
      description: "should pass if value is between minimim and maximum specified length (inclusive)",
      testData: ["John", "James"],
      rule: {
        ...rule,
        length: { min: 4, max: 5 }
      },
    },
    {
      description: "should treat a length value of number as the exact length (passing)",
      testData: ["James", "Jamie", "Lenny"],
      rule:  { ...rule, length: 5 }
    },
    {
      description: "should perform case-insensitive validation",
      testData: [
        "Gregory",
        "gregory",
        "GREGORY",
        "John",
        "JOHN",
        "john",
        "Andrew",
        "ANDREW",
      ],
      rule: rule,
    },
  ];

  failingTests.forEach(({ description, testData, rule }) => {
    it(description, function(done) {
      testData.forEach(value => {
        const result = validateAlpha(value, rule);

        expect(result).to.be.an("object");
        expect(result).to.have.property("valid", false);
        expect(result).to.have.property("rule").to.deep.equal(rule);
        expect(result).to.have.property("regex").to.be.instanceof(RegExp);
      });

      done();
    });
  });

  passingTests.forEach(({ description, testData, rule }) => {
    it(description, function(done) {
      testData.forEach(value => {
        const result = validateAlpha(value, rule);

        expect(result).to.be.an("object");
        expect(result).to.have.property("valid", true);
        expect(result).to.have.property("rule").to.deep.equal(rule);
        expect(result).to.have.property("regex").to.be.instanceof(RegExp);
      });

      done();
    });
  });
});
