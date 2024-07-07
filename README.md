# SimpliCity


## Development

### Automated testing

#### Testing all modules
- Run all tests: `npm test`.
- Run all tests with coverage report: `npm run test:coverage`.

#### Testing individual modules and methods
- Test a directory: `npm test -- --<directory>`.

  Examples:
    - `npm test -- --service-providers`
    - `npm test -- --framework`
- Test a module: `npm test -- --<module_name>`.
  Example: `npm test -- --app`.

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
    - Test the router (*src/framework/router.js* file) methods: `npm test -- --framework.router`.
    - Test the `group` method of the router module: `npm test -- --framework.router::group`.

#### Example tests
```bash
npm test -- --framework                           // Run all tests inside the src/framework/ directory
npm test -- --framework.factory.cache             // Run all tests inside the src/framework/factory/cache/ directory.
npm test -- --framework.factory.cache.file-cache  // Run only the tests within the file-cache.spec.js file
npm test -- --framework.factory.cache.FileCache   // Ditto
npm test -- --framework.component.router          // Test only the methods of the router module (src/framework/component/router.js)
npm test -- --framework.component.router::group   // Test only the group method of the router
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
