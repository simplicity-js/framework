"use strict";

const { validate: validateUpperCase } = require("../uppercase-validator");
const { chai } = require("./test-helpers");

let expect;
const rule = { type: "alpha" };


describe("uppercaseValidator(value, rule)", function() {
  before(async function() {
    expect = (await chai()).expect;
  });

  it("should perform uppercase-sensitive validation if `rule.uppercase` is true", function() {
    const newRule = { ...rule, uppercase: true };
    const testData = [
      { value: "Gregory", expectation: false },
      { value: "gregory", expectation: false },
      { value: "GREGORY", expectation: true  },
      { value: "John",    expectation: false },
      { value: "JOHN",    expectation: true  },
      { value: "john",    expectation: false },
      { value: "Andrew",  expectation: false },
      { value: "ANDREW",  expectation: true  },
    ];

    testData.forEach(({ value, expectation}) => {
      const result = validateUpperCase(value, newRule);

      expect(result).to.be.an("object");
      expect(result).to.have.property("valid", expectation);
      expect(result).to.have.property("rule").to.deep.equal(newRule);
      expect(result).to.have.property("regex").to.be.instanceof(RegExp);
    });
  });

  it("should treat `rule.upper` as an alias of `rule.uppercase`", function() {
    const newRule = { ...rule, upper: true };
    const testData = [
      { value: "Gregory", expectation: false },
      { value: "gregory", expectation: false },
      { value: "GREGORY", expectation: true  },
      { value: "John",    expectation: false },
      { value: "JOHN",    expectation: true  },
      { value: "john",    expectation: false },
      { value: "Andrew",  expectation: false },
      { value: "ANDREW",  expectation: true  },
    ];

    testData.forEach(({ value, expectation}) => {
      const result = validateUpperCase(value, newRule);

      expect(result).to.be.an("object");
      expect(result).to.have.property("valid", expectation);
      expect(result).to.have.property("rule").to.deep.equal(newRule);
      expect(result).to.have.property("regex").to.be.instanceof(RegExp);
    });
  });
});
