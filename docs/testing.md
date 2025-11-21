# Testing the CAP library

Test structure

- Unit tests live under `libs/cap-nest/src/cap/*.spec.ts` and target:
  - `CapService` behavior
  - `@CapSubscribe` decorator discovery
  - `CapSubscriberScanner` scanning and registration
  - `CapValidatePipe` validation
  - Scheduler/backoff behavior

Test helpers

- Typed in-memory helpers are under
  `libs/cap-nest/src/cap/testing/test-helpers.ts` and are used by multiple
  specs.
- There is an additional helper at `libs/cap-nest/src/testing/test-helpers.ts`
  (duplicate/alternate location). Consider consolidating to the `cap/testing`
  folder.

Run tests

```powershell
npm test
```

Coverage

- To run coverage focused on this library, use the CLI with roots and
  collectCoverageFrom (ad-hoc):

```powershell
npx jest --coverage --roots libs/cap-nest/src --collectCoverageFrom "libs/cap-nest/src/cap/**/*.ts"
start .\coverage\lcov-report\index.html
```

Notes

- Some tests temporarily use targeted ESLint disables to reduce noisy
  `@typescript-eslint` errors in fixture code. If you want stricter checks, we
  can iteratively remove those disables by improving typings of test fixtures.
