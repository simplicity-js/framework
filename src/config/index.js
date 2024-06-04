const app = require("./app");
const database = require("./database");
const logtail = require("./logtail");
const redis = require("./redis");


module.exports = Object.assign({}, app, database, logtail, redis);
