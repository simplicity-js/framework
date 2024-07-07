const LogFactory = require("../framework/factory/log");
const ServiceProvider = require("./service-provider");


module.exports = class LogServiceProvider extends ServiceProvider {
  constructor(config) {
    super(config);
  }

  register() {
    const container = this.container();
    const config = this.config();
    const appName = config.get("app.name");
    const rootDir = config.get("app.rootDir");
    const logConfig = config.get("logging");

    container.bind("logger", function getLogger() {
      return LogFactory.createLogger({
        label              : appName,
        logToFile          : logConfig.logToFile,
        logDir             : `${rootDir}/${logConfig.logDir}`,
        disableConsoleLogs : logConfig.logToConsole ? false : true,
        transports         : logConfig.channels,
        logExceptions      : logConfig.logExceptions,
        logRejections      : logConfig.logRejections,
      });
    });
  }
};
