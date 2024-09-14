const { csrfSync } = require("csrf-sync");
const { getRequestType } = require("../http/methods");
const {
  generateErrors,
  flashErrors,
  flashFormValues,
  deserialize,
} = require(
  "./middleware-helpers");

const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest(req) {
    const requestType = getRequestType(req);

    if(["form", "upload"].includes(requestType)) {
      return req.body["CSRFToken"];
    } else {
      return req.headers["x-csrf-token"];
    }
  }
});


module.exports = function createCsrfProtectionMiddleware(options) {
  const excludedRoutes = options.exclude;

  return [
    csrfProtectionMiddleware,
    csrfTokenGenerationMiddleware,
    csrfErrorHandlerMiddleware,
    sessionPreserverMiddleware,
  ];


  function csrfProtectionMiddleware(req, res, next) {
    if(Array.isArray(excludedRoutes) && excludedRoutes.includes(req.url)) {
      return next();
    } else {
      return csrfSynchronisedProtection(req, res, next);
    }
  }

  function csrfTokenGenerationMiddleware(req, res, next) {
    const token = req.csrfToken();

    res.locals.CSRFToken = token;
    req.session.csrfToken = req.session.csrfToken ?? token;

    next();
  }

  function csrfErrorHandlerMiddleware(err, req, res, next) {
    if(err.code === "EBADCSRFTOKEN" && err.message === "invalid csrf token") {
      res.locals.errors = generateErrors(res.locals, {
        name: "InvalidCSRFTokenError",
        fields: { csrf: "Invalid CSRF Token" },
      });

      flashErrors(req, res);
      flashFormValues(req);

      next();
    } else {
      next(err);
    }
  }

  /*
   * Take data from the session and add it to the response object (`res`).
   * This helps us not lose template variables when we do a `res.redirect("back")`.
   * As a result of this middleware, whenever a form is submitted and
   * a CSRF Token error or a validation error occurs,
   * the form page (template file) will always have:
   *   - errors object that contains CSRFTokenError and ValidationError
   *   - form object with a `get` method for persisting the form's values.
   * The controller page will also have access to:
   *   - res.locals.errors object
   *       (same object as the `errors` object of the template file)
   *   - res.locals.form object
   *       (same object as the `form` object of the template file)
   */
  function sessionPreserverMiddleware(req, res, next) {
    if(req.session.errors) {
      res.locals.errors = deserialize(req.session.errors);
    }

    if(req.session.form) {
      res.locals.form = deserialize(req.session.form);
    }

    next();
  }
};
