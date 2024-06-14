## Credits
- https://workos.com/docs/audit-logs

## Introduction
Audit Logs are a collection of events that contain information relevant
to notable actions taken by users in your application.
Every event in the collection contains details regarding
- what kind of action was taken (action),
- who performed the action (actor),
- what resources were affected by the action (targets), and
- additional details of when and where the action took place.

```js
{
  "action": "user.signed_in",
  "occurred_at": "2022-08-29T19:47:52.336Z",
  "actor": {
    "type": "user",
    "id": "user_01GBNJC3MX9ZZJW1FSTF4C5938",
    "metadata": {
      "role": "admin"
    }
  },
  "targets": [
    {
      "type": "user",
      "id": "user_98432YHF",
      "name": "Jon Smith"
    },
    {
      "type": "team",
      "id": "team_01GBNJD4MKHVKJGEWK42JNMBGS",
      "metadata": {
        "owner": "user_01GBTCQ2"
      }
    }
  ],
  "context": {
    "location": "123.123.123.123",
    "user_agent": "Chrome/104.0.0.0"
  },
  "metadata": {
    "extra": "data"
  }
}
```

These events are similar to application logs and analytic events, but are fundamentally different in their intent.
They aren't typically used for active monitoring/alerting,
rather they exist as a paper trail of potentially sensitive actions
taken by members of an organization for compliance and security reasons.

```js
await auditLogService.createEvent({
  action: 'user.signed_in',
  occurredAt: new Date(),
  actor: {
    type: 'user',
    id: 'user_01GBNJC3MX9ZZJW1FSTF4C5938',
    metadata: {
      "role": "admin"
    }
  },
  targets: [
    {
      type: 'team',
      id: 'team_01GBNJD4MKHVKJGEWK42JNMBGS',
    },
  ],
  context: {
    location: '123.123.123.123',
    userAgent: 'Chrome/104.0.0.0',
  },
});
```

## Events https://workos.com/docs/events

All event objects contain the following attributes:
- event: Distinguishes the event type.
- id: Unique identifier for the event.
- data:	Event payload. Payloads match the corresponding API objects.
- created_at:	Timestamp of when the event occurred.

```js
{
  "event": "user.created",
  "id": "event_02F4KLW3C56P083X43JQXF4FO9",
  "data": {
    "object": "user",
    "id": "user_01E4ZCR3C5A4QZ2Z2JQXGKZJ9E",
    "email": "todd@example.com",
    "first_name": "Todd",
    "last_name": "Rundgren",
    "email_verified": false,
    "profile_picture_url": "https://workoscdn.com/images/v1/123abc",
    "created_at": "2023-11-18T09:18:13.120Z",
    "updated_at": "2023-11-18T09:18:13.120Z"
  },
  "created_at": "2023-11-18T04:18:13.126Z"
}
```

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
npm test -- --service-providers                   // Run all tests inside the src/service-providers/ directory.
npm test -- --service-providers.service-provider  // Run tests inside the src/service-providers/service-provider.js file
npm test -- --service-providers.ServiceProvider   // Ditto
npm test -- --framework.factory.cache             // Run all tests inside the src/framework/factory/cache/ directory.
npm test -- --framework.factory.cache.file-cache  // Run only the tests within the file-cache.spec.js file
npm test -- --framework.factory.cache.FileCache   // Ditto
npm test -- --config::*                           // Test only methods of the config module (src/config.js)
npm test -- --config::get                         // Test only the get method of the config module
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
