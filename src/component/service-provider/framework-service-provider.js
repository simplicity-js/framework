"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { isDirectory } = require("../../lib/file-system");
const { LCFirst } = require("../../lib/string");
const ServiceProvider = require(".");


/*
 * Specifically created to bind Controllers, Services into the
 * Service Container.
 */
module.exports = class FrameworkServiceProvider extends ServiceProvider {
  constructor(options) {
    super(options);
  }

  /**
   * Register the service's dependencies in the dependency container.
   */
  register() {
    const appRoot = this.appRoot();
    const container = this.container();
    const srcDir = `${appRoot}/src`;
    const httpDirectory = path.join(srcDir, "app", "http");
    const controllersDirectory = path.join(httpDirectory, "controllers");
    const modelsDirectory = path.join(httpDirectory, "models");
    const servicesDirectory = path.join(httpDirectory, "services");

    this.#registerControllers(container, controllersDirectory);
    this.#registerModels(container, modelsDirectory);
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

      controllerFiles.forEach(bindControllerToServiceContainer.bind(this));
    } catch(e) {
      this.#log("error", "Unable to bind controllers to Service Container", e);
    }

    function bindControllerToServiceContainer(filename) {
      if(filename.endsWith("-controller.js") || filename.endsWith("Controller.js")) {
        const controllerClass = require(path.join(dir, filename));

        this.#bindClassInstance(container, controllerClass);
      }
    }
  }

  /**
   * Bind model class names to their instances in the container.
   * This allows us to resolve model instances
   * using the model class name.
   */
  #registerModels(container, dir) {
    const bindModels = (function bindModels(dir) {
      const modelFiles = fs.readdirSync(dir.replace(/\\/g, "/"));

      modelFiles.forEach(filename => {
        bindModelToServiceContainer.bind(this)(dir, filename);
      });
    }).bind(this);

    try {
      bindModels(dir);
    } catch(e) {
      this.#log("error", "Unable to bind models to Service Container", e);
    }

    function bindModelToServiceContainer(dir, filename) {
      const file = path.join(dir, filename);

      if(isDirectory(file)) { // mongoose, sequelize, any ORM directory
        bindModels(file);
      } else if(filename !== "index.js") {
        const modelClass = require(file);

        this.#bindClassInstance(container, modelClass);
      }
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

      serviceFiles.forEach(bindServiceToServiceContainer.bind(this));
    } catch(e) {
      this.#log("error", "Unable to bind services to Service Container", e);
    }

    function bindServiceToServiceContainer(filename) {
      if(filename.endsWith("-service.js") || filename.endsWith("Service.js")) {
        const serviceClass = require(path.join(dir, filename));

        this.#bindClassInstance(container, serviceClass);
      }
    }
  }

  #bindClassInstance(container, theClass) {
    /*
     * Bind the class' name to an instance of the class.
     * So, we can resolve the class from the container
     * using the class' name.
     */
    container.instantiate(theClass);

    /*
     * Also bind the camelCase version of the class' name to
     * an instance of the class.
     * We can, therefore, also resolve the class from the container
     * using the camelCase version of the class' name
     */
    container.instantiate(LCFirst(theClass.name), theClass);
  }

  #log(type, message, data) {
    const logger = this.container().resolve("logger");

    logger.log(type, `FrameworkServiceProvider:: ${message}`, data);
  }
};
