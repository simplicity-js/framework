"use strict";

const os = require("node:os");
require("loadavg-windows");
const { parseTimestamp } = require("./date");

module.exports = serverStatus;

function serverStatus() {
  // parseTimestamp expects milliseconds.
  // process.uptime() returns the uptime in seconds,
  // so we convert to milliseconds first.
  const formattedTimeStamp = parseTimestamp(process.uptime() * 1000);
  const [oneMinute, fiveMinutes, fifteenMinutes] = os.loadavg();
  const days    = formattedTimeStamp.days    ?? 0 ;
  const hours   = formattedTimeStamp.hours   ?? 0;
  const minutes = formattedTimeStamp.minutes ?? 0;
  const seconds = formattedTimeStamp.seconds ?? 0;
  const uptime  = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  const status = {
    application: {
      build_number: process.env.BUILD,
      build_time: process.env.BUILD_TIME,
      commit: process.env.COMMIT,
      deployment: process.env.DEPLOYMENT,
      name: process.env.APP,
      version: process.env.npm_package_version
    },
    server: {
      architecture: os.arch(),
      platform: `${os.platform()} ${os.release()}`,
      cpus: os.cpus(),
      memory: {
        total: os.totalmem() + " Bytes",
        free: os.freemem() + " Bytes"
      },
      node: process.version,
      status: "healthy",
      uptime: uptime,
      utilization: {
        "fifteen minute average": fifteenMinutes,
        "five minute average": fiveMinutes,
        "one minute average": oneMinute
      }
    }
  };

  return status;
};
