"use strict";

const { validate: validateLowerCase } = require("../lowercase-validator");
const { chai } = require("./test-helpers");

let expect;
const rule = { type: "alpha" };


describe("lowercaseValidator(value, rule)", function() {
  before(async function() {
    expect = (await chai()).expect;
  });

  it("should perform lowercase-sensitive validation if `rule.lowercase` is true", function() {
    const newRule = { ...rule, lowercase: true };
    const testData = [
      { value: "Gregory", expectation: false },
      { value: "gregory", expectation: true  },
      { value: "GREGORY", expectation: false },
      { value: "John",    expectation: false },
      { value: "JOHN",    expectation: false },
      { value: "john",    expectation: true  },
      { value: "Andrew",  expectation: false },
      { value: "andrew",  expectation: true  }
    ];

    testData.forEach(({ value, expectation}) => {
      const result = validateLowerCase(value, newRule);

      expect(result).to.be.an("object");
      expect(result).to.have.property("valid", expectation);
      expect(result).to.have.property("rule").to.deep.equal(newRule);
      expect(result).to.have.property("regex").to.be.instanceof(RegExp);
    });
  });

  it("should treat `rule.lower` as an alias for `rule.lowercase`", function() {
    const newRule = { ...rule, lower: true };
    const testData = [
      { value: "Gregory", expectation: false },
      { value: "gregory", expectation: true  },
      { value: "GREGORY", expectation: false },
      { value: "John",    expectation: false },
      { value: "JOHN",    expectation: false },
      { value: "john",    expectation: true  },
      { value: "Andrew",  expectation: false },
      { value: "andrew",  expectation: true  }
    ];

    testData.forEach(({ value, expectation}) => {
      const result = validateLowerCase(value, newRule);

      expect(result).to.be.an("object");
      expect(result).to.have.property("valid", expectation);
      expect(result).to.have.property("rule").to.deep.equal(newRule);
      expect(result).to.have.property("regex").to.be.instanceof(RegExp);
    });
  });
});
