# Contributing

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

Run lint with auto-fix:

```powershell
npm run lint
```

Run lint without modifying files:

```powershell
npm run lint:check
```

## Focused Test Commands

Core library tests:

```powershell
npm run test:lib:cap-nest
```

Integration tests:

```powershell
npm run test:integration
```

Focused coverage for `cap-nest`:

```powershell
npx jest --coverage --roots libs/cap-nest/src --collectCoverageFrom "libs/cap-nest/src/cap/**/*.ts"
```

Verify publish package contents:

```powershell
npm run pack:dry-run
```

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
- Documentation is updated for public API or behavior changes.
- ADR is added or updated for architecture-level decisions.
