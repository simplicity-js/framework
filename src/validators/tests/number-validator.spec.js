"use strict";
const { validate: validateNumber } = require( "../number-validator");
const { chai } = require("./test-helpers");

let expect;
const rule = { type: "number" };


describe("numberValidator(value, rule)", function() {
  before(async function() {
    expect = (await chai()).expect;
  });

  const failingTests = [
    {
      description: "should fail if value is undefined, null, false, or an empty string",
      testData: [undefined, null, false, ""],
      rule: rule,
    },
    {
      description: "should fail if value contains non-numeric characters",
      testData: ["1234h", "hello"],
      rule: rule,
    },
    {
      description: "should fail if value contains whitespace character",
      testData: ["1234 5678"],
      rule: rule,
    },
    {
      description: "should fail if value is less than minimum specified length",
      testData: ["1234"],
      rule: {
        ...rule,
        length: { min: 5 },
      },
    },
    {
      description: "should fail if value is greater than the maximum specified length",
      testData: [12345, "12345"],
      rule: {
        ...rule,
        length: { max: 4 },
      },
    },
    {
      description: "should fail if value is not between minimim and maximum specified length (inclusive)",
      testData: ["123", "123456", 123, 123456],
      rule: {
        ...rule,
        length: { min: 4, max: 5 },
      },
    },
    {
      description: "should treat a length value of number as the exact length (failing)",
      testData: ["0123456", "6598", "321", "357219"],
      rule: { ...rule, length: 5 },
    },
  ];

  const passingTests = [
    {
      description: "should pass if value contains only numeric characters",
      testData: ["0", "1", "2", "0123456789"],
      rule: rule,
    },
    {
      description: "should allow whitespace character if `rule.allowWhitespace` is true",
      testData: ["1234 5678"],
      rule: { ...rule, allowWhitespace: true },
    },
    {
      description: "should match any arbitrary length number if no length is given",
      testData: ["1234567890".repeat(20)],
      rule: rule,
    },
    {
      description: "should pass if value is at least the minimum specified length",
      testData: ["12345", 12345],
      rule: {
        ...rule,
        length: { min: 5 },
      },
    },
    {
      description: "should pass if value is at most the maximum specified length",
      testData: [1234, "1234"],
      rule: {
        ...rule,
        length: { max: 4 }
      },
    },
    {
      description: "should pass if value is between minimim and maximum specified length (inclusive)",
      testData: ["0123", "01234"],
      rule: {
        ...rule,
        length: { min: 4, max: 5 },
      },
    },
    {
      description: "should treat a length value of number as the exact length (passing)",
      testData: ["56789", 12345],
      rule: { ...rule, length: 5 },
    },
  ];

  failingTests.forEach(({ description, testData, rule }) => {
    it(description, function(done) {
      testData.forEach(value => {
        const result = validateNumber(value, rule);

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
        const result = validateNumber(value, rule);

        expect(result).to.be.an("object");
        expect(result).to.have.property("valid", true);
        expect(result).to.have.property("rule").to.deep.equal(rule);
        expect(result).to.have.property("regex").to.be.instanceof(RegExp);
      });

      done();
    });
  });
});
