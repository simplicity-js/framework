"use strict";

const { validate: validateAlphanumeric } = require("../alphanumeric-validator");
const { chai } = require("./test-helpers");

let expect;
const rule = { type: "alnum" };


describe("alphanumericValidator(value, rule)", function() {
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
      description: "should fail if value contains other character except A - Z, 0 - 9 _, or -",
      testData: ["hero_$", "J0#n", "$%^&*()/\\"],
      rule: rule,
    },
    {
      description: "should fail if value contains whitespace character",
      testData: ["John doe", "John doe 53"],
      rule: rule,
    },
    {
      description: "should fail if value is less than minimum specified length",
      testData: ["John", "J0hn"],
      rule: {
        ...rule,
        length: { min: 5 }
      },
    },
    {
      description: "should fail if value is greater than the maximum specified length",
      testData: ["James", "J4m3s"],
      rule: {
        ...rule,
        length: { max: 4 }
      },
    },
    {
      description: "should fail if value is not between minimim and maximum specified length (inclusive)",
      testData: ["T0m", "Andr3w", "Fr4nc3s"],
      rule: {
        ...rule,
        length: { min: 4, max: 5 },
      },
    },
    {
      description: "should treat a length value of number as the exact length (failing)",
      testData: ["Ev4", "Frances", "Gregory", "J4ne", "John", "Tom", "Andrew"],
      rule: { ...rule, length: 5 }
    }
  ];

  const passingTests = [
    {
      description: "should allow whitespace character if `rule.allowWhitespace` is true",
      testData: ["John doe", "John doe 53"],
      rule: { ...rule, allowWhitespace: true }
    },
    {
      description: "should pass if value contains only A - Z, 0 - 9, _, or -",
      testData: ["John", "John1", "John_9", "John_", "_John_", "Jo-h-n-", "-Jo-h-n", "-Jo-h-n-", "12-3_456789-0"],
      rule: rule,
    },
    {
      description: "should match any arbitrary length string if no length is specified",
      testData: [
        "ThisShouldB3AString0fVeryLongLengthWithoutWhitespaceThatShouldBeValidatedAgainst",
        `This Should B3 A String 0f Very Long Length With
          Whitespace That Should Be Validated Against`
      ],
      rule: { ...rule, allowWhitespace: true }
    },
    {
      description: "should pass if value is at least the minimum specified length",
      testData: ["James", "J4m35"],
      rule: {
        ...rule,
        length: { min: 5 },
      },
    },
    {
      description: "should pass if value is at most the maximum specified length",
      testData: ["John", "J04n"],
      rule: {
        ...rule,
        length: { max: 4 },
      },
    },
    {
      description: "should pass if value is between minimim and maximum specified length (inclusive)",
      testData: ["John", "J4m3s", "Fr4nc3s"],
      rule: {
        ...rule,
        length: { min: 4, max: 8 }
      },
    },
    {
      description: "should treat a length value of number as the exact length (passing)",
      testData: ["James", "Jenny", "Jamie", "Lenny", "Laura"],
      rule: { ...rule, length: 5 }
    },
    {
      description: "should perform case-insensitive validation",
      testData: [
        "Ev4",
        "EV4",
        "FRANCES",
        "frances",
        "Gregory",
        "GR3GORY",
        "John",
        "JO4N",
        "4ndrew",
      ],
      rule: rule
    },
  ];

  failingTests.forEach(({ description, testData, rule }) => {
    it(description, function(done) {
      testData.forEach(value => {
        const result = validateAlphanumeric(value, rule);

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
        const result = validateAlphanumeric(value, rule);

        expect(result).to.be.an("object");
        expect(result).to.have.property("valid", true);
        expect(result).to.have.property("rule").to.deep.equal(rule);
        expect(result).to.have.property("regex").to.be.instanceof(RegExp);
      });

      done();
    });
  });
});
