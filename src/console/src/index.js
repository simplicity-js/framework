#!/usr/bin/env node

"use strict";

if(require.main === module) {
  require("./cli");
}

module.exports = require("./lib");
