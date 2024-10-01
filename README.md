# Simplicity

The Framework Repository for the [Simplicity MVC Framework][simplicity].

## Getting Started

### Installation

```bash
$ npm install -g @simplicityjs/installer
```

### Creating a Sample Project

```bash
$ simplicity new example-app
```

### Running the Sample Project

```bash
$ cd example-app

$ node bob start
```

Your application is now accessible at http://localhost:8800.

## [Features][features]

## [Documentation][documentation]

## How to contribute

- Report Bugs
- Suggest Enhancements
- Make changes and create pull Requests

To report bugs or suggest enhancements, please use the [issues][issues] page.

To make pull requests:

- [setup the project](#project-setup) locally.
- make your changes;
  Please try to follow the [development](#development) guidelines while making your changes.
- [commit and push](#committing-and-pushing-changes) the changes.
- [submit the pull request][pr].


## Project setup

1.  [Fork the repo][fork] to your GitHub account.
2.  Clone the repo: `git clone https://github.com/simplicity-js/framework`.
3.  Navigate to the repo's directory: `cd simplicity`.
4.  Run `npm install` to install dependencies.
5.  Create a branch for your PR with `git checkout -b pr/your-branch-name`.

> Tip: Keep your `main` branch pointing at the original repository while still making
> pull requests from branches on your fork. To do this, run:
>
> ```bash
> git remote add upstream https://github.com/simplicity-js/framework.git
> git fetch upstream
> git branch --set-upstream-to=upstream/main main
> ```
>
> This does the following:
> 1. adds the original repository as a "remote" called "upstream"
>
> 2. fetches the git information from that remote
>
> 3. sets your local `main` branch to pull the latest changes from the upstream main branch whenever you run `git pull`.
>
> Now you can make all of your pull request branches based on this local `main` branch.
>
> Whenever you want to update your local `main` branch, do a regular `git pull`.
> You can push the updated changes to your remote origin master by running `git push`.


## Development

### Automated testing

#### Testing all modules
- Run all tests: `npm test`.
- Run all tests with coverage report: `npm run test:coverage`.

#### Testing individual modules and methods
- Test a directory: `npm test -- --<directory>`.

  Examples:
    - `npm test -- --application`
    - `npm test -- --component`
- Test a module: `npm test -- --<module_name>`.
  Example: `npm test -- --env`.

  **Note:** To test the `config` module (as opposed to testing one of its methods),
  use `npm test -- --config::*`. This is because `npm test -- --config`
  results in npm thinking we are passing config info and returning error:

  `Error: Not enough arguments following: config`

  Using `config::*` enables us to achieve our desired functionality.
- Test a module's method: `npm test -- --<module_name::<method_name>`
  Example: `npm test -- --config::get`.
- Test nested module method:
  `npm test -- --<directory>.<file_name>[::<method_name>]` or
  `npm test -- --<directory.<ModuleName>[::<method_name>]`

  Examples:
    - Test the router (*src/component/router/index.js* file) methods: `npm test -- --component.router`.

#### Example tests
```bash
npm test                                // Run all tests inside the src/ directory
npm test -- --factory.cache             // Run all tests inside the src/factory/cache/ directory.
npm test -- --factory.cache.file-cache  // Run only the tests within the file-cache.spec.js file
npm test -- --factory.cache.FileCache   // Ditto
npm test -- --component.router          // Test only the methods of the router module (src/component/router.js)
```

### Committing and Pushing changes
This project follows the [Conventional Commits Specification][commits] and uses [ESLint][eslint] for linting.

Before committing your changes, run `npm run lint:fix` to check and automatically fix linting errors.
If there are linting errors that cannot be automatically fixed,
they are highlighted, so that you can manually fix them.

To commit your changes, run `npm run commit`. This will:

- generate conventional commit messages using [commitizen][commitizen] and [cz-conventional-changelog][changelog]
- check to make sure there are no linting errors
- run the tests to make sure the changes do not break existing functionality
- check that the minimum code-coverage threshold is attained
- apply the commit

Once everything checks out and the commit is applied,
you can then push your changes by running `git push -u remote pr/your-branch-name`.

You can keep making and pushing updates to your pull request branch
until you feel ready to have your changes merged into the main project.

When you are ready to have your changes merged, you can then [open a pull request][pr].


## Style guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature").
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
- Limit the first line (subject line) to 72 characters or less.
- Reference issues and pull requests liberally after the first line.
- Consider starting the commit message with an applicable emoji:
    <!-- https://gist.github.com/parmentf/035de27d6ed1dce0b36a -->
    - :sparkles: `:sparkles:` when adding a new feature
    - :art: `:art:` when improving the format/structure of the code
    - :bookmark: `:bookmark:` when creating a version tag
    - :racehorse: `:racehorse:` when improving performance
    - :non-potable_water: `:non-potable_water:` when plugging memory leaks
    - :memo: `:memo:` when writing docs
    - :bulb: `:bulb:` when adding doc-comments to source code
    - :package: `:package:` when making a change to `package.json`
    - :penguin: `:penguin:` when fixing something on Linux
    - :apple: `:apple:` when fixing something on macOS
    - :checkered_flag: `:checkered_flag:` when fixing something on Windows
    - :bug: `:bug:` when fixing a bug
    - :ambulance: `:ambulance:` whem making a critical hot fix
    - :hammer: `:hammer:` when refactoring code
    - :wheelchair: `:wheelchair:` when making accessibility (a11y) changes
    - :fire: `:fire:` when removing code or files
    - :green_heart: `:green_heart:` when fixing the CI build
    - :white_check_mark: `:white_check_mark:` when adding tests
    - :heavy_check_mark: `:heavy_check_mark:` when making tests pass
    - :lock: `:lock:` when dealing with security
    - :arrow_up: `:arrow_up:` when upgrading dependencies
    - :arrow_down: `:arrow_down:` when downgrading dependencies
    - :shirt: `:shirt:` when removing linter warnings
    - :zap: `:zap:` when making general updates
    - :boom: `:boom:` when making breaking changes
    - :ok_hand: `:ok_hand:` code-review: okay
    - :hankey: `:hankey:` code-review: needs improvement






[bug]: https://github.com/simplicity-js/framework/labels/bug
[changelog]: https://npm.im/cz-conventional-changelog
[commitizen]: https://npm.im/commitizen
[documentation]: https://github.com/simplicity-js/simplicity/blob/main/.github/DOCUMENTATION.md
[commits]: https://conventionalcommits.org/
[eslint]: https://eslint.org/
[features]: https://github.com/simplicity-js/simplicity/blob/main/README.md#features
[fork]: https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/fork-a-repo
[fr]: https://github.com/simplicity-js/simplicity/labels/feature%20request
[issues]: https://github.com/simplicity-js/framework/issues
[pr]: https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request
[simplicity]: https://github.com/simplicity-js/simplicity
