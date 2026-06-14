# Contributing

Thanks for helping improve CAP for NestJS. This guide covers the basics for
local development and pull requests. Deeper project-specific notes live in
[docs/contributing.md](docs/contributing.md).

## Local Setup

Install dependencies from the repository root:

```sh
npm install
```

The project uses npm workspaces for packages under `libs/*`. The root package is
private and exists to coordinate development, tests, and releases.

## Common Commands

Run unit tests:

```sh
npm test
```

Run end-to-end tests:

```sh
npm run test:e2e
```

Run integration tests that do not require external Azure Service Bus access:

```sh
npm run test:integration
```

Run lint checks without modifying files:

```sh
npm run lint:check
```

Apply lint fixes:

```sh
npm run lint
```

Format TypeScript files:

```sh
npm run format
```

Build libraries and the demo app:

```sh
npm run build
```

Verify package contents before publishing:

```sh
npm run pack:dry-run
```

Run repository health checks:

```sh
npm run fallow:audit
npm run fallow:health
```

## Pull Request Guidelines

- Keep changes focused and explain the user-facing or maintainer-facing reason.
- Add or update tests when changing behavior.
- Update docs when changing public APIs, package setup, adapter behavior, or
  dashboard behavior.
- Keep public API changes minimal while the beta package line is stabilizing.
- Avoid committing generated artifacts such as `dist`, `build`, `coverage`,
  nested `node_modules`, logs, cache directories, or tarballs.
- Explain any skipped checks in the pull request description.

## Code Style

- Preserve NestJS dependency injection patterns.
- Use the exported Symbol tokens for CAP storage and transport abstractions.
- Prefer strongly typed runtime boundaries. Use `unknown` and narrow it before
  use when data comes from transports, storage, or request input.
- Keep adapter-specific behavior behind storage and transport interfaces.
- Add comments only when they clarify non-obvious behavior.

## Commit Messages

Conventional Commit style is recommended because releases use Lerna with
conventional commit support:

```txt
feat(cap-nest): add subscriber option
fix(dashboard): handle missing inbox record
docs: clarify adapter setup
test(storage): cover retry scheduling
```

## Reporting Bugs and Requesting Features

Use the GitHub issue templates when possible. Include the package name, version,
NestJS version, Node.js version, reproduction steps, and expected behavior.

Please do not report security vulnerabilities in public issues. See
[SECURITY.md](SECURITY.md).
