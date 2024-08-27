/* eslint-env node, mocha */

const { chai } = require("../lib/test-helper");
const bootstrap = require(".");

let expect;


module.exports = {
  bootstrap() {
    describe("bootstrap({ appRoot, config, container, providers })", function() {
      before(async function() {
        expect = (await chai()).expect;
      });

      it("should throw if a provider is neither a constructor nor a class", function() {
        const providers = [ { register() {} } ];

        expect(() => bootstrap({ providers }))
          .to.throw(/A Service Provider must be a class or constructor function/);
      });

      it("should throw if a provider has no register method defined", function() {
        const providers = [ function TestServiceProvider() {} ];

        expect(() => bootstrap({ providers })).to.throw(
          "Service providers must define a 'register()' method. " +
          "Service Provider 'TestServiceProvider' has no 'register()' method defined."
        );
      });

      it("should invoke the 'register()' method of every passed provider", function() {
        let className;
        let funcName;
        let protoFuncName;

        class ClassServiceProvider {
          register() { className = "ClassServiceProvider"; }
        }

        function FunctionServiceProvider() {
          this.register = function register() {
            funcName = "FunctionServiceProvider";
          };
        }

        function ProtoFunctionServiceProvider() {}

        ProtoFunctionServiceProvider.prototype.register = function register() {
          protoFuncName = "PrototypeInheritedRegisterMethod";
        };

        expect(className).to.be.undefined;
        expect(funcName).to.be.undefined;
        expect(protoFuncName).to.be.undefined;

        bootstrap({ providers: [
          ClassServiceProvider,
          FunctionServiceProvider,
          ProtoFunctionServiceProvider
        ]});

        expect(className).to.equal("ClassServiceProvider");
        expect(funcName).to.equal("FunctionServiceProvider");
        expect(protoFuncName).to.equal("PrototypeInheritedRegisterMethod");
      });
    });
  }
};
