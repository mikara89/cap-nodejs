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

Check compile-only examples:

```sh
npm run examples:check
```

Generate API reference docs:

```sh
npm run docs:api
```

Verify package contents before publishing:

```sh
npm run pack:dry-run
```

Inspect and validate the publishable workspace package set:

```sh
npm run packages:list
npm run packages:verify
```

Inspect or execute the same affected plan used by pull-request CI:

```sh
npm run ci:affected:plan -- --base origin/main --head HEAD --json
npm run ci:affected -- --base origin/main --head HEAD
```

The planner includes internal dependents for runtime, export, manifest, and
build-config changes, then builds through the shared dependency graph. Tests
run from the repository root with the root Jest configuration. Root/global
configuration changes escalate to complete validation. Storage runtime and
contract changes conditionally enable the database integration gate.

Run repository health checks:

```sh
npm run fallow:audit
npm run fallow:health
```

## Adding a Package

Publishable packages are discovered dynamically from the shared `libs/*`
workspace boundary. A package participates when its `package.json` is not
private; aggregate builds run its own `build` script in dependency-first order,
and aggregate pack dry-runs include it automatically. No root aggregate package
list needs to be edited. Existing `build:lib:*` root aliases are optional
developer conveniences, not the package-discovery authority.

Aggregate build and pack commands run sequentially, stream package output, and
stop at the first failing package. A failure reports that package's name and
workspace directory and returns its non-zero exit status.

1. Create `libs/<package>/package.json`.
2. Use an `@mikara89/cap-*` package name.
3. Add a valid package-owned `build` script.
4. Add public npm publish metadata.
5. Add source, tests, README, and exports.
6. Run:

   ```sh
   npm run packages:verify
   npm run build:libs
   npm run pack:dry-run
   npm run release:verify
   ```

The repository-private workspace tool owns generic discovery and deterministic
local orchestration. Lerna remains the independent version and publish
authority. Specialized pack smoke tests remain package-specific because they
validate isolated installation behavior. The affected-validation policy reuses
the same descriptors and graph; it does not maintain another package list.

## Pull Request Guidelines

Pull requests run one `build-and-test` affected-validation path with one
dependency install. Package-focused changes build and test the changed packages
and compatibility dependents; package documentation can select only a pack
check. Repository-global changes run the complete suite. Pushes to `main`,
manual CI runs, and the release workflow retain complete validation.

Superseded pull-request runs are cancelled. Optional real-broker integrations
remain manual and never receive pull-request secrets. Use a manual CI workflow
dispatch on the intended ref when you want to force the complete suite. See
[development validation](docs/development-validation.md) for the classification
rules and local equivalents.

- Keep changes focused and explain the user-facing or maintainer-facing reason.
- Add or update tests when changing behavior.
- Update docs when changing public APIs, package setup, adapter behavior, or
  dashboard behavior.
- Regenerate `docs/api/` with `npm run docs:api` when public exports change.
- Keep `examples/` compile-checked with `npm run examples:check`.
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
