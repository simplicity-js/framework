#!/usr/bin/env node

"use strict";

const cp = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const eol = require("node:os").EOL;
const { parseArgs } = require("node:util");
const pkg = require("../package.json");
const postPublish = require("./postpublish");
const prePublish = require("./prepublish");

const currDir = __dirname.replace(/\\/g, "/");
const rootDir = path.dirname(currDir).replace(/\\/g, "/");

function exec(command, args, options) {
  args = args || [];
  let stdout = "";
  let stderr = "";
  const followLogs = options?.followLogs;
  const ps = cp.spawn(command, args, { shell: true });

  return new Promise((resolve, reject) => {
    ps.stdout.on("data", data => {
      data = data.toString();

      if(followLogs) {
        console.log(data);
      } else {
        stdout += data;
      }
    });

    ps.stderr.on("data", data => {
      data = data.toString();

      if(followLogs) {
        console.error(data);
      } else {
        stderr += data;
      }
    });

    ps.on("close", (code) => {
      if(code === 0) {
        resolve(followLogs ? true : stdout.trim());
      } else {
        reject(followLogs ? false : stderr.trim());
      }
    });
  });
};

function execInherit(command, args) {
  args = args || [];
  cp.spawn(command, args, { stdio: "inherit", shell: true });
}

function getCliArgs(config) {
  const { positionals: list, values: options } = parseArgs(config);

  return { list, options };
}

const { list, options } = getCliArgs({
  allowPositionals: true,
  options: {
    preview: { type: "boolean" },
  },
});

async function publish({ version, preview }) {
  try {
    const RELEASE_BRANCH = "1.x";
    const CURRENT_BRANCH =  await exec("git rev-parse", ["--abbrev-ref HEAD"]);
    let VERSION = version;

    /*
     * Make sure the release tag is provided.
     */
    if(!VERSION) {
      console.error(
        `Release tag has to be provided.${eol}` +
        "Usage: `npm run release [--preview] Major.minor.patch`"
      );

      process.exit(1);
    }

    /*
     * Ensure the package version matches the release version
     */
    if(VERSION !== pkg.version) {
      console.error(
        `The release version (${VERSION}) ` +
        `does not match the package version (${pkg.version})`
      );

      process.exit(1);
    }

    /*
     * Make sure current branch and release branch match.
     */
    if(CURRENT_BRANCH !== RELEASE_BRANCH) {
      console.error(
        `Release branch (${RELEASE_BRANCH}) ` +
        `does not match the current active branch (${CURRENT_BRANCH}).${eol}` +
        `Run \`git checkout ${RELEASE_BRANCH}\` to checkout the release branch.`
      );

      process.exit(1);
    }

    /*
     * Make sure the working directory is clear.
     */
    if(await exec("git status", ["--porcelain"])) {
      console.error(
        "Your working directory is dirty. " +
        "Commit or stash any pending changes and try again."
      );

      process.exit(1);
    }

    /*
     * Make sure latest changes are fetched first.
     */
    await exec("git fetch origin");

    /*
     * Make sure that the release branch and the main branch are in sync.
     */
    if(await exec("git rev-parse HEAD") !== await exec("git rev-parse main")) {
      console.error(
        "Your branch is out of date with the `main` branch. " +
        "Kindly reconcile the differences before proceeding."
      );

      process.exit(1);
    }

    /*
     * Make sure that release branch is in sync with origin.
     */
    if(await exec("git rev-parse HEAD") !== await exec(`git rev-parse origin/${RELEASE_BRANCH}`)) {
      console.error(
        "Your branch is out of date with its upstream. " +
        "Kindly pull or push any changes before releasing."
      );

      process.exit(1);
    }

    /*
     * Always prepend with "v"
     */
    if(!VERSION.startsWith("v")) {
      VERSION = `v${VERSION}`;
    }

    /*
     * Delete the node_modules folder,
     * reinstall the packages,
     * and run the tests to ensure everything still works
     */
    await exec("npm ci", [], { followLogs: true });
    await exec("npm run test:coverage", [], { followLogs: true });

    /*
     * Tag Framework
     */
    await execInherit(`git tag -a ${VERSION} -m ":bookmark: create release tag ${VERSION}"`);

    if(!preview) {
      await execInherit(`git push origin ${VERSION}`);
    }

    prePublish();

    let publishCommand = "npm publish --access public";

    if(preview) {
      publishCommand += " --dry-run";
    }

    await execInherit(publishCommand);

    if(!preview) {
      postPublish();
    }
  } catch(err) {
    console.error("Error publishing to npm registry: ", err);
  }
}

publish({
  version: list.length ? list[0] : "",
  preview: options.preview,
});
