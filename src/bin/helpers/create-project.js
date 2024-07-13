/*const exec = require("./exec");*/
const {
  copy, createDirectory, createFile, isDirectory, isEmpty, pathExists,
  BIN_DIR, PATH_SEP, TYPE_DIR, TYPE_FILE
} = require("./file-system");


module.exports = {
  createProject,
};

async function createProject(name, dir) {
  const projectDir = `${dir}${PATH_SEP}${name}`;

  if(!isDirectory(projectDir)) {
    createDirectory(projectDir);
  }

  if(!isEmpty(projectDir)) {
    throw new TypeError(`The directory ${projectDir} is not empty`);
  }

  process.chdir(projectDir);

  const directoryTree = {
    name: "src",
    type: TYPE_DIR,
    children: [
      {
        name: "app",
        type: TYPE_DIR,
        children: [
          {
            name: "http",
            type: TYPE_DIR
          }
        ]
      },
      {
        name: "bootstrap",
        type: TYPE_DIR,
        children: [
          {
            name: "providers.js",
            type: TYPE_FILE
          },
        ],
      },
      {
        name: "config",
        type: TYPE_DIR,
        children: [
          {
            name: "app.js",
            type: TYPE_FILE,
          },
          {
            name: "cache.js",
            type: TYPE_FILE,
          },
          {
            name: "database.js",
            type: TYPE_FILE,
          },
          {
            name: "redis.js",
            type: TYPE_FILE,
          },
          {
            name: "session.js",
            type: TYPE_FILE,
          }
        ]
      },
      {
        name: "public",
        type: TYPE_DIR,
        children: [
          {
            name: "css",
            type: TYPE_DIR,
            children: [
              {
                name: "styles.css",
                type: TYPE_FILE,
              }
            ],
          },
          {
            name: "js",
            type: TYPE_DIR,
            children: [
              {
                name: "styles.js",
                type: TYPE_FILE,
              }
            ],
          },
        ],
      },
      {
        name: "service-providers",
        type: TYPE_DIR,
        children: [
          {
            name: "app-service-provider.js",
            type: TYPE_FILE,
          },
          {
            name: "cache-service-provider.js",
            type: TYPE_FILE,
          },
          {
            name: "database-service-provider.js",
            type: TYPE_FILE,
          },
          {
            name: "log-service-provider.js",
            type: TYPE_FILE,
          },
          {
            name: "service-provider.js",
            type: TYPE_FILE,
          },
        ],
      },
      {
        name: "views",
        type: TYPE_DIR,
        children: [
          {
            name: "layouts",
            type: TYPE_DIR,
            children: [
              {
                name: "layout.pug",
                type: TYPE_FILE,
              },
            ],
          },
          {
            name: "404.pug",
            type: TYPE_FILE,
          },
          {
            name: "home.pug",
            type: TYPE_FILE,
          },
        ],
      },
    ],
  };

  await createDirectoryStructure(directoryTree);

  const staticFiles = [
    ".editorconfig", ".env.example",".gitignore",
    ".mocharc.json", "eslint.config.mjs", "nodemon.json",
  ];

  staticFiles.forEach(file => {
    copy(
      `${BIN_DIR}${PATH_SEP}setup-files${PATH_SEP}${file}`,
      `${projectDir}${PATH_SEP}${file}`
    );
  });

  copy(".env.example", ".env"); // The CWD is the project directory
  copy(
    `${BIN_DIR}${PATH_SEP}setup-files${PATH_SEP}index.js`,
    `${projectDir}${PATH_SEP}src${PATH_SEP}index.js`
  );

  //const dependencies = [];

  //const devDependencies = [];

  //await exec("npm install -S @simplicity/framework");
}

async function createDirectoryStructure(root, parent) {
  root.parent = parent;

  const type = root.type;
  const name = root.name;
  const children = root.children;
  let destPath = "";

  while(parent) {
    destPath = `${parent.name}${PATH_SEP}${destPath}`;

    parent = parent.parent;
  }

  destPath += name;

  if(type === TYPE_DIR) {
    createDirectory(destPath);

    for(let i = 0; i < children?.length; i++) {
      await createDirectoryStructure(children[i], root);
    }
  } else if(type === TYPE_FILE) {
    const sep = PATH_SEP;
    const parent = root.parent;
    const fileLocation = `${BIN_DIR}${sep}setup-files${sep}${parent.name}${sep}${name}`;

    if(pathExists(fileLocation)) {
      copy(fileLocation, destPath);
    } else {
      createFile(destPath);
    }
  }
}
