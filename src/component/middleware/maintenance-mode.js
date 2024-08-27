"use strict";

const serialijse = require("serialijse");
const getCache = require("../cache");
const { STATUS_CODES } = require("../http");

const { deserialize } = serialijse;

async function getState(appKey, config) {
  let state;
  const cacheDriver = config.get("app.maintenance").driver;
  const cache = getCache(cacheDriver, config, `${appKey}.state`);

  try {
    state = deserialize(await cache.get(`${appKey}.state`, {}));
  } catch {
    state = {};
  }

  return state;
}

module.exports = function createMaintenanceModeMiddleware(appKey, config) {
  return async function maintenanceModeMiddleware(req, res, next) {
    const state = await getState(appKey, config);
    const mmCookie = "maintenance-mode-bypass";

    if(state.mode === "maintenance") {
      if(state.secret && req.path.endsWith(state.secret)) {
        res.cookie(mmCookie, state.secret);

        return res.redirect(req.path.replace(state.secret, ""));
      } else if(req.cookies[mmCookie] === state.secret) {
        next();
      } else {
        res.status(STATUS_CODES.HTTP_SERVICE_UNAVAILABLE);

        if(state.refresh) {
          res.set("refresh", state.refresh);
        }

        return res.send("Maintenance is ongoing");
      }
    } else {
      next();
    }
  };
};
