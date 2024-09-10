"use strict";

const { validate: validateLength } = require( "../length-validator");
const { chai } = require("./test-helpers");

let expect;


describe("lengthValidator(value, rule)", function() {
  before(async function() {
    expect = (await chai()).expect;
  });

  const failingTests = [
    {
      description: "should fail if value is undefined, null, or false",
      testData: [undefined, null, false],
      rule: { length: 0 },
    },
    {
      description: "should fail if value is less than minimum specified length",
      testData: ["John"],
      rule: {
        length: { min: 5 },
      },
    },
    {
      description: "should fail if value is greater than the maximum specified length",
      testData: ["Janet"],
      rule: {
        length: { max: 4 }
      },
    },
    {
      description: "should fail if value is not between minimim and maximum specified length (inclusive)",
      testData: ["Ada", "Miranda"],
      rule: {
        length: { min: 4, max: 5 },
      },
    },
    {
      description: "should treat a length value of number as the exact length (failing)",
      testData: ["Frances", "Joan", "Ada", "Andrew"],
      rule: { length: 5 },
    },
  ];

  const passingTests = [
    {
      description: "should match any arbitrary length string if no length is given",
      testData: ["AStringOfVeryLongLengthWithoutWhitespaceThatShouldBeValidatedAgainst"],
      rule: {},
    },
    {
      description: "should match an empty string if no length is given",
      testData: [""],
      rule: {},
    },
    {
      description: "should pass if value is at least the minimum specified length",
      testData: ["James"],
      rule: {
        length: { min: 5 },
      },
    },
    {
      description: "should pass if value is at most the maximum specified length",
      testData: ["Joan"],
      rule: {
        length: { max: 4 }
      },
    },
    {
      description: "should pass if value is between minimim and maximum specified length (inclusive)",
      testData: ["John", "Janet", 1234, "56789"],
      rule: {
        length: { min: 4, max: 5 },
      },
    },
    {
      description: "should treat a length value of number as the exact length (passing)",
      testData: ["James"],
      rule: { length: 5 },
    },
    {
      description: "should support newline in strings",
      testData: [
        `A
          multiline
          string`
      ],
      rule: {
        length: { min: 5 }
      },
    },
  ];

  failingTests.forEach(({ description, testData, rule }) => {
    it(description, function(done) {
      testData.forEach(value => {
        const result = validateLength(value, rule);

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
        const result = validateLength(value, rule);

        expect(result).to.be.an("object");
        expect(result).to.have.property("valid", true);
        expect(result).to.have.property("rule").to.deep.equal(rule);
        expect(result).to.have.property("regex").to.be.instanceof(RegExp);
      });

      done();
    });
  });
});
