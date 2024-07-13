/**
 * Available commands:
 * 1. simplicity create-project <project name>
 * 2. simplicity make:[controller, model, view, provider]
 */


//#!/usr/bin/env node

const { parseArgs } = require("node:util");
const { createProject } = require("./helpers/create-project");


const options = {};

const parsed = parseArgs({ options, tokens: true, allowPositionals: true });


processCLICommand(parsed);


async function processCLICommand(args) {
  const { /*values: options,*/ positionals: list/*, tokens*/ } = args;

  const operation = list[0];

  if(operation === "create-project") {
    const projectName = list[1];

    await createProject(projectName, process.cwd());
    return;
  }

  if(operation.startsWith("make:")) {
    const componentType = operation.slice(5);
    const componentName = list[1];

    createComponent(componentType, componentName, args);

    return;
  }

  throw new TypeError(`Unknown argument ${operation}`);
}

function createComponent(type, name) {
  const validTypes = ["controller", "model", "view", "provider"];

  if(!validTypes.includes(type)) {
    throw new TypeError(
      `Unknown type ${type}. ` +
      `Valid types include ${validTypes.join(", ")}`
    );
  }

  console.log("CREATING %s COMPONENT: %s", type, name);
}
