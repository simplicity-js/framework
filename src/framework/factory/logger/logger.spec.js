"use strict";

/* eslint-env node, mocha */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const util = require("node:util");
const sinon = require("sinon");
const { chai } = require("../../lib/test-helper");
const LoggerFactory = require(".");


const thisDir = path.resolve(__dirname, ".").replace(/\\/g, "/");
const logDir  = `${thisDir}/.logs`;
const logFile = `${logDir}/console.log`;

// Create the log directory if it doesn't already exist.
fs.existsSync(logDir) || fs.mkdirSync(logDir, { recursive: true });

function spyOnConsoleOutput(object = "stdout") {
  object = `_${object}`;

  const originalMethod = console[object].write;

  // Overwrite the console._stdout.write used by winston internally.
  // So that it doesn't write to the actual console, cluttering our screen.
  // Instead, it writes to an output file.
  console[object].write = () => fs.appendFileSync(logFile, util.inspect(arguments, { depth: 12 }));

  // spy on the overwritten console method
  const consoleSpy = sinon.spy(console[object], "write");

  return {
    sinonSpy: consoleSpy,
    restore: function() {
      // Restore the sinon spy and the original console method
      // so that the test result will be output to the screen, not to the file.
      sinon.restore();
      console[object].write = originalMethod;
    }
  };
}


module.exports = {
  createLogger() {
    describe("LoggerFactory", function() {
      let expect;

      before(async function() {
        expect = (await chai()).expect;
      });

      after(function(done) {
        fs.rmSync(logDir, { recursive: true, force: true });
        done();
      });

      describe(".createLogger(options)", function() {
        it("should return a logger object", function() {
          const logger = LoggerFactory.createLogger();

          expect(logger).to.be.an("object");
          expect(logger).to.have.property("log").to.be.a("function");
        });

        it("should use the 'console' as the default transport", function() {
          const logger = LoggerFactory.createLogger();
          const { sinonSpy, restore } = spyOnConsoleOutput();

          // Call the logger.log, which internally calls console._stdout.write
          // that is intercepted by our "spy" version.
          logger.log("info", "log");

          restore();

          const expected = `info: log {"service":"FrameworkLogger"}${os.EOL}`;

          expect(sinonSpy.getCall(0).args[0]).to.equal(expected);
          expect(sinonSpy.calledWith(expected)).to.equal(true);
        });

        it("should use the label 'FrameworkLogger' as the default 'label' for the logger", function() {
          const logger = LoggerFactory.createLogger();
          const { sinonSpy, restore } = spyOnConsoleOutput();

          // Call the logger.log, which internally calls console._stdout.write
          // that is intercepted by our "spy" version.
          logger.log("info", "log");

          restore();

          const expected = /"service":"FrameworkLogger"/;

          expect(sinonSpy.getCall(0).args[0]).to.match(expected);
          expect(sinonSpy.calledWith(sinon.match(expected))).to.equal(true);
        });

        it("should let the user specify a custom 'label' for the logger", function() {
          const label = "LogService";
          const logger = LoggerFactory.createLogger({ label });
          const { sinonSpy, restore } = spyOnConsoleOutput();

          // Call the logger.log, which internally calls console._stdout.write
          // that is intercepted by our "spy" version.
          logger.log("info", "log");

          restore();

          const expected = new RegExp(`"service":"${label}"`);

          expect(sinonSpy.getCall(0).args[0]).to.match(expected);
          expect(sinonSpy.calledWith(sinon.match(expected))).to.equal(true);
        });

        it("should use npm log levels as the default log priority protocol", function() {
          const logger = LoggerFactory.createLogger();
          const logLevels = ["error", "warn", "info", "http", "verbose", "debug", "silly"];

          for(const level of logLevels) {
            expect(logger).to.have.property(level).to.be.a("function");
          }
        });

        it("should let the user specify custom log priority levels", function() {
          const syslogLevels = {
            emerg: 0, alert: 1, crit: 2, error: 3,
            warning: 4, notice: 5, info: 6, debug: 7
          };

          const logger = LoggerFactory.createLogger({ levels: syslogLevels });
          const logLevels = Object.keys(syslogLevels);

          for(const level of logLevels) {
            expect(logger).to.have.property(level).to.be.a("function");
          }
        });

        it("should let the user disable console logging", function() {
          let logger = LoggerFactory.createLogger({ disableConsoleLogs: true });
          const { sinonSpy, restore } = spyOnConsoleOutput("stderr");

          // Call the logger.log, which internally calls console._stdout.write
          // that is intercepted by our "spy" version.
          logger.log("info", "logText");

          restore();

          // The default transport is the console. So, if we disable it,
          // winston throws an error when we attempt to write.
          const expected = /^\[winston\] Attempt to write logs with no transports/;

          expect(sinonSpy.getCall(0).args[0]).to.match(expected);
          expect(sinonSpy.calledWith(sinon.match(expected))).to.equal(true);
        });

        it("should let the user specify the option to log to file", function() {
          const scopedLogDir = path.join(__dirname, ".scoped.logs");
          fs.rmSync(scopedLogDir, { recursive: true, force: true });

          LoggerFactory.createLogger();

          expect(fs.existsSync(scopedLogDir)).to.be.false;

          LoggerFactory.createLogger({ logToFile: true, logDir: scopedLogDir });

          expect(fs.existsSync(scopedLogDir)).to.be.true;
        });

        it("should throw if the 'logToFile' option is set to true with no 'logDir' option specified", function() {
          const thrower = () => {
            LoggerFactory.createLogger({ logToFile: true });
          };

          expect(thrower).to.throw("The 'logToFile' option requires a 'logDir' options to be specified");
        });

        describe("logger instance", function() {

        });
      });
    });
  }
};
