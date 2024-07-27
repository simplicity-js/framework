"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ServiceProvider = require(".");


/*
 * Specifically created to bind Controllers, Services into the
 * Service Container.
 */
module.exports = class FrameworkServiceProvider extends ServiceProvider {
  #config = null;

  constructor(config) {
    super();

    this.#config = config;
  }

  /**
   * Register the service's dependencies in the dependency container.
   */
  register() {
    const config = this.#config;
    const container = this.container();
    const httpDirectory = path.join(config.get("app.srcDir"), "app", "http");
    const controllersDirectory = path.join(httpDirectory, "controllers");
    const servicesDirectory = path.join(httpDirectory, "services");

    this.#registerControllers(container, controllersDirectory);
    this.#registerServices(container, servicesDirectory);
  }

  /**
   * Bind controller class names to their instances in the container.
   * This allows us to resolve controller instances
   * using the controller class name.
   */
  #registerControllers(container, dir) {
    try {
      const controllerFiles = fs.readdirSync(dir.replace(/\\/g, "/"));

      controllerFiles.forEach(function bindControllerToServiceContainer(filename) {
        if(filename.endsWith("-controller.js") || filename.endsWith("Controller.js")) {
          const controllerClass = require(path.join(dir, filename));

          container.instantiate(controllerClass);
        }
      });
    } catch(e) {
      this.#log("error", "Unable to bind controllers to Service Container", e);
    }
  }

  /**
   * Bind controller class names to their instances in the container.
   * This allows us to resolve controller instances
   * using the controller class name.
   */
  #registerServices(container, dir) {
    try {
      const serviceFiles = fs.readdirSync(dir.replace(/\\/g, "/"));

      serviceFiles.forEach(function bindServiceToServiceContainer(filename) {
        if(filename.endsWith("-service.js") || filename.endsWith("Service.js")) {
          const serviceClass = require(path.join(dir, filename));

          container.instantiate(serviceClass);
        }
      });
    } catch(e) {
      this.#log("error", "Unable to bind services to Service Container", e);
    }
  }

  #log(type, message, data) {
    const logger = this.container().resolve("logger");

    logger.log(type, `FrameworkServiceProvider:: ${message}`, data);
  }
};
