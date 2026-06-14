# Contributing

Start with the root [CONTRIBUTING.md](../CONTRIBUTING.md) for the short public
guide. This file adds project-specific workflow and health-check details.

## Local Workflow

Install dependencies:

```powershell
npm install
```

Run tests:

```powershell
npm test
```

Build:

```powershell
npm run build
```

Check compile-only examples:

```powershell
npm run examples:check
```

Generate API reference docs:

```powershell
npm run docs:api
```

Run lint with auto-fix:

```powershell
npm run lint
```

Run lint without modifying files:

```powershell
npm run lint:check
```

Format TypeScript files:

```powershell
npm run format
```

## Repo Health Checks

Fallow provides advisory repo health checks for architecture boundaries,
dependency hygiene, dead code, duplication, and complexity. During the initial
rollout, CI runs the changed-code audit with `continue-on-error` so findings are
visible without blocking releases. CI also runs a health score gate that fails if
the repo health score drops below `70`; existing complexity findings remain
advisory until they are triaged.

Run the changed-code audit:

```powershell
npm run fallow:audit
```

Review package-level health, hotspots, and refactor targets:

```powershell
npm run fallow:health
```

Run the same score threshold used by CI:

```powershell
npm run fallow:health:ci
```

Review cleanup candidates:

```powershell
npm run fallow:dead-code
```

Review duplicated logic:

```powershell
npm run fallow:dupes
```

The boundary policy follows the package architecture: `@cap/cap-nest` is the
core package; storage, transport, and dashboard packages depend inward on core;
the test application may compose all packages. Treat first-run findings as
triage input unless they are obvious safe cleanups.

## Focused Test Commands

Core library tests:

```powershell
npm run test:lib:cap-nest
```

Integration tests:

```powershell
npm run test:integration
```

External Azure Service Bus integration gate:

```powershell
npm run test:integration:servicebus
```

This command fails if neither `SERVICEBUS_CONNECTION_STRING` nor an available
emulator path can be used.

Focused coverage for `cap-nest`:

```powershell
npx jest --coverage --roots libs/cap-nest/src --collectCoverageFrom "libs/cap-nest/src/cap/**/*.ts"
```

Verify publish package contents:

```powershell
npm run pack:dry-run
```

CI uses `npm ci` so native dependencies can install their bindings. Publishable
packages use `prepack`, not `prepare`, so workspace packages are built only when
package contents are verified or published.

## Coding Guidelines

- Preserve NestJS dependency injection patterns.
- Use the exported Symbol tokens for CAP abstractions.
- Keep runtime code strongly typed where possible; prefer `unknown` and narrow
  it before use.
- Add or update tests when changing behavior.
- Keep adapter behavior behind storage and transport interfaces.
- Avoid committing generated artifacts such as nested `node_modules`, `dist`,
  coverage output, or `tsbuildinfo`.

## Documentation Guidelines

- Update root `README.md` for public positioning or package-map changes.
- Update `examples/` and run `npm run examples:check` when public usage
  changes.
- Regenerate `docs/api/` with `npm run docs:api` when public exports change.
- Update `docs/package-exports.md` when supported import paths change.
- Update `docs/architecture.md` when core flows change.
- Update `docs/adapters.md` when adapter contracts or first-party adapters
  change.
- Update `docs/cap-dashboard.md` when dashboard routes or security behavior
  change.
- Add or update an ADR for durable architecture decisions.
- Update `docs/roadmap.md` when MVP/Beta/v1/Later scope changes.

## Pull Request Checklist

- Tests pass or skipped tests are explained.
- Build passes when public exports, package setup, or examples changed.
- Fallow findings from touched code are reviewed, fixed, or intentionally left
  as advisory rollout work.
- Documentation is updated for public API or behavior changes.
- ADR is added or updated for architecture-level decisions.
- Package dry-run output is reviewed when package metadata, package files, or
  public exports changed.
- Security-sensitive changes are reviewed with [SECURITY.md](../SECURITY.md) in
  mind, especially dashboard access control and credential handling.

## Commit Messages

Conventional Commit style is recommended because release automation uses Lerna
with conventional commit support:

```txt
feat(cap-nest): add subscriber option
fix(dashboard): handle missing inbox record
docs: clarify adapter setup
test(storage): cover retry scheduling
```

## Security Reports

Do not open public issues for vulnerabilities. Follow the process in
[SECURITY.md](../SECURITY.md).
