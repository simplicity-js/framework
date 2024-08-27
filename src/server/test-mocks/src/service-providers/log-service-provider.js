const LogFactory = require("@simplicityjs/framework/factory/log");
const ServiceProvider = require("./service-provider");


module.exports = class LogServiceProvider extends ServiceProvider {
  constructor(config) {
    super(config);
  }

  register() {
    const container = this.container();
    const config = this.config();
    const appRoot = this.appRoot();
    const appName = config.get("app.name");
    const logConfig = config.get("logging");

    container.bind("logger", function getLogger() {
      return LogFactory.createLogger({
        label              : appName,
        logToFile          : logConfig.logToFile,
        logDir             : `${appRoot}/${logConfig.logDir}`,
        disableConsoleLogs : logConfig.logToConsole ? false : true,
        transports         : logConfig.channels,
        logExceptions      : logConfig.logExceptions,
        logRejections      : logConfig.logRejections,
      });
    });
  }
};
