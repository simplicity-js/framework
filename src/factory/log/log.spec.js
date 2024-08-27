"use strict";

/* eslint-env node, mocha */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const util = require("node:util");
const sinon = require("sinon");
const winston = require("winston");
const { chai } = require("../../lib/test-helper");
const LogFactory = require(".");


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
  console[object].write = function() {
    fs.appendFileSync(logFile, util.inspect(arguments, { depth: 12 }));
  };

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
    describe("Factory", function() {
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
          const logger = LogFactory.createLogger();

          expect(logger).to.be.an("object");
          expect(logger).to.have.property("log").to.be.a("function");
        });

        it("should use the 'console' as the default transport", function() {
          const logger = LogFactory.createLogger();
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
          const logger = LogFactory.createLogger();
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
          const logger = LogFactory.createLogger({ label });
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
          const logger = LogFactory.createLogger();
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

          const logger = LogFactory.createLogger({ levels: syslogLevels });
          const logLevels = Object.keys(syslogLevels);

          for(const level of logLevels) {
            expect(logger).to.have.property(level).to.be.a("function");
          }
        });

        it("should let the user disable console logging", function() {
          let logger = LogFactory.createLogger({ logToConsole: false });
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

          LogFactory.createLogger();

          expect(fs.existsSync(scopedLogDir)).to.be.false;

          LogFactory.createLogger({ logToFile: true, logDir: scopedLogDir });

          expect(fs.existsSync(scopedLogDir)).to.be.true;
        });

        it("should throw if the 'logToFile' option is set to true with no 'logDir' option specified", function() {
          const thrower = () => {
            LogFactory.createLogger({ logToFile: true });
          };

          expect(thrower).to.throw("The 'logToFile' option requires a 'logDir' options to be specified");
        });

        it("should let the user add an array of transports", function(done) {
          this.timeout(5000);

          const filename = "custom.logs";
          const filepath = path.join(__dirname, filename);

          expect(fs.existsSync(filepath)).to.equal(false);

          LogFactory.createLogger({
            transports: [new winston.transports.File({ filename: filepath })]
          });

          setTimeout(() => {
            expect(fs.existsSync(filepath)).to.equal(true);

            fs.rmSync(filepath, { force: true });
            done();
          }, 2000);
        });

        /*it("should let the user specify if they want to log uncaught exceptions", function(done) {
          this.timeout(5000);
          const logger = LogFactory.createLogger({ logExceptions: true });
          const { sinonSpy, restore } = spyOnConsoleOutput("stdout");

          process.on("uncaughtException", function() {
            restore();

            const expected = /Error: Uncaught exception/;

            // Since we are spying on/monkey-patching stdout,
            // the first output (call[0]) is the one that
            // displays the test title: "should let the user specify if..."
            // The error output is captured in the second (call[1]).
            // Why spying on stdout instead of stderr?
            // Probably because the setting of createLogger exitOnError is false,
            // so the error output is delivered via the stdout rather than stderr.
            expect(sinonSpy.getCall(1).args[0]).to.match(expected);
            expect(sinonSpy.calledWith(sinon.match(expected))).to.equal(true);
          });

          // Cf. https://github.com/winstonjs/winston/issues/1289#issuecomment-396527779
          setTimeout(() => { throw new Error("Uncaught exception"); }, 1000);
        });*/
      });
    });
  }
};
