# Coverage & Focused Reports

By default the repository test runner includes both `apps/` and `libs/`, which
can make the overall coverage number hard to interpret. Use the following
approaches to get focused coverage for `cap-nest`.

Ad-hoc focused coverage (no config changes):

```powershell
npx jest --coverage --roots libs/cap-nest/src --collectCoverageFrom "libs/cap-nest/src/cap/**/*.ts"
```

Generate per-package report (recommended for CI):

- Add a small Jest config file `libs/cap-nest/jest.cap-nest.config.js` with
  `roots`, `collectCoverageFrom`, `coverageDirectory`, and run
  `npx jest --config libs/cap-nest/jest.cap-nest.config.js --coverage`.

Exclude specific files/folders

- Add `coveragePathIgnorePatterns` to package-level Jest config or add
  `/* istanbul ignore file */` to the top of files you intentionally want
  omitted (test helpers, scripts, CLI tooling).

Coverage thresholds

- Add `coverageThreshold` to the config to enforce minimums per package.
