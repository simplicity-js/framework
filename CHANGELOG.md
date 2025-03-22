# 1.3.0 (2025-03-22)

### New Features

*  **express.json:** :sparkles: Add the ability to configure the `express.json` middleware ([3ecd1f5a](https://github.com/simplicity-js/framework/commit/3ecd1f5ab7e631c167da048afa99a5c665e8d7a4))

# 1.2.1 (2024-10-16)

### Bug Fixes

*  Fix for "Error: Cannot find module 'colors'" in console component ([14ccaea3](https://github.com/simplicity-js/framework/commit/14ccaea39c7ccbf7f16f5075f61bf3d2fd0bb5e6))

# 1.2.0 (2024-10-15)

### New Features

* **router:**  :sparkles: New router (convenience) methods `router.name` and `router.namespace` ([62099bd5](https://github.com/simplicity-js/framework/commit/62099bd5690865efaa69425d688cb38fef13d642))
* **csrf:**  :sparkles: Automatic CSRF protection for web routes ([ce290144](https://github.com/simplicity-js/framework/commit/ce290144cbb8cdeb5dba2611d60085acbd201532))
* **compression:**  :sparkles: Compress static assets ([2187c726](https://github.com/simplicity-js/framework/commit/2187c72625dbbd85f772892ab42fb9cedff26316))

### Bug Fixes

* **router:**  :bug: Resolve controller classes in resource controllers ([98acdb8a](https://github.com/simplicity-js/framework/commit/98acdb8a2be8873f67c4c4789b7134182b5360a1))
* **views:**  :bug: Properly render nested view files ([96d48b1c](https://github.com/simplicity-js/framework/commit/96d48b1cfa950875fd6b115d61024475379012a1))

### Other Changes

*  Session support is now only for web (non-API) routes ([3bee725a](https://github.com/simplicity-js/framework/commit/3bee725a3aa6cbe4ac0a5448d85ebe68cd964825))

# 1.1.0 (2024-09-11)

### New Features

* **validation:**  :sparkles: Validate incoming requests ([a15fe6f9](https://github.com/simplicity-js/framework/commit/a15fe6f9b1c6bce5a8cb69db680acd6cbe7d56dc))

### Bug Fixes

* **fix:**  :bug: create components (using `node bob make:*`) in any order ([fb24f2bd](https://github.com/simplicity-js/framework/commit/fb24f2bdf755615c7c4f69f64489183e9c78269b))
* **fix:**  :bug: in development mode, see latest updates on restart due to file system changes ([8f87c926](https://github.com/simplicity-js/framework/commit/8f87c926400b5e63e9e95277d382e7180ba1a712))


# 1.0.0 (2024-09-03)

### Features
* :sparkles: Modular
* :sparkles: Scalable
* :sparkles: Expressive Syntax
* :sparkles: MVC Architecture
* :sparkles: Conventional Directory Structure
* :sparkles: ORM Agnostic
* :sparkles: Multiple Database Support
* :sparkles: Multiple View Template Engines Support
* :sparkles: Database Migrations
* :sparkles: Unit Testing
* :sparkles: Maintenance Mode
* :sparkles: Request Caching
* :sparkles: Logging
* :sparkles: Web and API Routes
* :sparkles: Health Check Route
* :sparkles: Session support
* :sparkles: Customizable 404, 503, and Health Check Views
* :sparkles: Advanced Router Methods
  `controller`, `middleware`, `resource` `match` (`some`), `any` (`all`), `redirect`, `permanentRedirect`, `view`
* :sparkles: Closure and Controller-based Route Handlers
* :sparkles: RESTful Controllers
* :sparkles: Dynamic Configuration Management
* :sparkles: Dependency Management with Awilix DI Container
* :sparkles: Controller, Model, and Service Class Bindings
* :sparkles: Multiple Options for Port Configuration
* :sparkles: Environment-based Configuration with `.env` file
* :sparkles: Bob CLI
