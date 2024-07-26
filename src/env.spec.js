/* eslint-env node, mocha */

const { chai } = require("./lib/test-helper");
const env = require("./env");


let expect;
const specialValues =  {
  "first"   : { value: "false",   evaluatesTo: false },
  "second"  : { value: "(false)", evaluatesTo: false },
  "third"   : { value: "true",    evaluatesTo: true  },
  "fourth"  : { value: "(true)",  evaluatesTo: true  },
  "fifth"   : { value: "empty",   evaluatesTo: ""    },
  "sixth"   : { value: "(empty)", evaluatesTo: ""    },
  "seventh" : { value: "null",    evaluatesTo: null  },
  "eighth"  : { value: "(null)",  evaluatesTo: null  },
};

module.exports = {
  createApp() {
    describe("createApp", function createApp_Spec() {
      before(async function() {
        expect = (await chai()).expect;
      });

      it("should read string values from the environment", function() {
        const originalProcessUser = process.env.username;
        const username = "simplymichael";

        expect(env("USERNAME")).to.equal(originalProcessUser);
        expect(env("USERNAME")).to.not.equal(username);

        process.env.USERNAME = username;

        expect(env("USERNAME")).to.equal(username);
        expect(env("USERNAME")).to.not.equal(originalProcessUser);

        process.env.USERNAME = originalProcessUser;

        expect(env("USERNAME")).to.equal(originalProcessUser);
        expect(env("USERNAME")).to.not.equal(username);
      });

      it("should read number values from the environment", function() {
        process.env.INTEGER = 200;
        process.env.FLOAT = 3.15;

        expect(env("INTEGER")).to.equal("200");
        expect(env("FLOAT")).to.equal("3.15");
      });

      it("should read boolean values from the environment", function() {
        process.env.TRUE = true;
        process.env.FALSE = false;

        expect(env("TRUE")).to.equal(true);
        expect(env("FALSE")).to.equal(false);
      });

      it("should read null values from the environment", function() {
        process.env.NULL = null;

        expect(env("NULL")).to.equal(null);
      });

      it("should return passed undefined if specified env variable does not exist", function() {
        expect(env("NON_EXISTENT_VAR")).to.equal(undefined);
      });

      it("should return passed `defaultValue` if specified env variable does not exits", function() {
        expect(env("NON_EXISTENT_VAR", "default")).to.equal("default");
      });

      it("should return special types for special values", function() {
        Object.keys(specialValues).forEach(function(key) {
          const data = specialValues[key];

          process.env[key] = data.value;

          expect(env(key)).to.equal(data.evaluatesTo);
        });
      });
    });
  },
};
