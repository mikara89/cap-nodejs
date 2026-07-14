# Development validation

CAP has three validation paths with different responsibilities:

- Pull requests use repository-owned affected validation.
- Pushes to `main` and manual CI runs use complete repository validation.
- The manual release workflow independently repeats complete validation before
  publication.

The private root coordinates npm workspaces under `libs/*`. Lerna remains in
independent mode and is the version/publish authority; affected validation
does not calculate versions, create tags, publish, or alter release selection.

## Pull-request validation

The required `build-and-test` job checks out complete history, sets up Node,
and runs `npm ci` exactly once. It then compares GitHub's immutable pull-request
base SHA with the checked-out head or merge commit:

```sh
node tools/affected-validation.js plan \
  --base <pull-request-base-sha> \
  --head <checked-out-head-sha> \
  --output affected-plan.json

node tools/affected-validation.js run --plan affected-plan.json
```

The step summary lists the comparison range, changed files, directly affected
packages, affected dependents, dependency-first build set, root-Jest test set,
pack set, enabled gates, skipped gates, and database-gate status. A superseded
pull-request run is cancelled. Pushes to `main` are never cancelled by a newer
run.

Every pull request retains package verification, affected-tool tests, and full
repository lint. Full lint currently costs much less than the complete build
and test suite and avoids missing changed root, application, or test files.

### Package and dependent selection

Package ownership comes from `tools/workspace-packages.js`; the affected tool
does not scan or maintain a second package list. Runtime, export, manifest, and
build-consumed TypeScript changes include direct and transitive internal
dependents because their compilation, tests, or packed compatibility can be
affected. Required unchanged internal dependencies are added to the build set,
and the shared graph produces dependency-first order.

Test-only changes select that package without expanding runtime dependents.
README or changelog-only changes select its pack dry-run without selecting
runtime tests. Every selected package is built or packed once. Cycles and
invalid metadata fail through the shared package verifier.

Affected unit tests always run with the root Jest executable and root
configuration. Package-local Lerna Jest execution is intentionally unsupported
because it bypasses root `ts-jest` transforms and module mappings on Linux.
Integration and real-broker tests are excluded from the affected unit-test
file set. Prisma test clients are generated before selected Prisma tests.

### Impact policy

| Change                                                                                   | Pull-request behavior                                                         |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Package runtime, exports, manifest, or build config                                      | Build/test that package plus compatibility dependents; pack changed artifacts |
| Package tests only                                                                       | Build/test that package; do not expand runtime dependents                     |
| Package README or changelog only                                                         | Pack that package; skip runtime tests                                         |
| Root package/lockfile, root build config, Lerna/Nx/Nest config, shared package discovery | Escalate to the complete repository suite                                     |
| Release tooling or release workflow                                                      | Package/release verification and release-tool tests; no automatic DB gate     |
| CI workflow or affected tooling                                                          | Affected/workflow invariants plus package and release safety checks           |
| Root documentation only                                                                  | Valid zero-package plan with repository/tool checks; no runtime build         |
| Application or e2e input                                                                 | Application build and e2e tests                                               |
| Executable example or compiler config                                                    | Examples type-check                                                           |
| Publishable runtime source, declarations/exports, or TypeDoc input                       | API-doc generation; examples for public/framework integration inputs          |

Database integration runs when storage runtime, storage contracts, core
publish/received/outbox contracts, lease/claim/retry behavior, Prisma schema,
SQL-affecting configuration, or DB integration tests change. A storage README
or unit-spec-only change does not claim database coverage and does not run the
gate. The summary says whether the DB gate passed, failed, or was not required.

E2E runs for the test application and for core, Nest, Express, or transport
behavior used by it. When the impact is ambiguous, the policy chooses the
safer gate.

Storage `/nest` implementation or export changes also type-check examples and
generate API documentation because those files form public integration inputs.

Selected package dry-runs cover changed packed source, manifests, and included
documentation. The affected path builds those packages explicitly, then
disables `prepack` lifecycle scripts during the dry-run so a package is not
built twice. The standalone complete pack command retains its existing
lifecycle behavior. Specialized install/isolation smokes are conditional on
their packages or tooling:

- RabbitMQ, Kafka, and AWS SNS/SQS transport smokes;
- storage `/nest` export smoke for Knex, TypeORM, and Prisma;
- dashboard-core/core compatibility isolation smoke.

A generic package-tooling change enables all pack and specialized smoke checks.

## Local affected validation

Commit or stage the comparison state before using Git refs; uncommitted files
are not part of `git diff <base>..<head>`.

```sh
npm run ci:affected:plan -- \
  --base origin/main \
  --head HEAD \
  --json

npm run ci:affected -- \
  --base origin/main \
  --head HEAD
```

The first command is diagnostic and does not execute gates. The second creates
a temporary plan, executes it, preserves child exit status, and removes the
temporary file. In GitHub Actions the workflow uses
`github.event.pull_request.base.sha`, not `origin/main`, so a queued run cannot
silently compare against a later target-branch state.

To force complete validation, use **Run workflow** for CI on the intended ref.
`workflow_dispatch` always takes the complete path. A global configuration
change also escalates a pull request automatically.

Useful focused checks remain available:

```sh
npm run packages:list
npm run packages:verify
npm run test:lib:cap-core
npm run test:lib:cap-storage-prisma
npm run pack:smoke:rabbitmq
```

## Complete `main` validation

Pushes to `main` and manual CI runs execute the full suite in `build-and-test`
without a preceding affected job:

1. workspace package and release verification;
2. legacy-name and release-tool tests;
3. full lint and Fallow gates;
4. full libraries/application build;
5. examples and API docs;
6. workspace-link and cap-nest type checks;
7. all unit and e2e tests;
8. complete database integration;
9. all package dry-runs;
10. RabbitMQ, Kafka, AWS, storage-Nest, and dashboard isolation pack smokes.

Optional real-broker jobs remain available only through manual inputs. They
perform their own checkout, dependency install, and build because GitHub jobs
do not share a filesystem. The Azure Service Bus job is the only CI job that
receives its connection secret, and it cannot run for pull requests.

## Release validation

`.github/workflows/release.yml` remains manual, complete, and independent of
the PR planner. It checks out full history and validates before the protected
`npm-production` publication job. A green affected PR is not publication
approval. See [release.md](./release.md) for the release and recovery rules.

## Baseline before the affected fast path

The latest successful PR run inspected before this refactor was
[CI run 29153945210](https://github.com/mikara89/cap-nodejs/actions/runs/29153945210):

- `affected-checks`: 63 seconds;
- complete `build-and-test`: 300 seconds;
- PR critical path: 369 seconds;
- dependency installs: 2;
- aggregate builds: 2 (one affected, one complete).

These are exact observations from one run, not p50 or p95 measurements.
Multiple documentation, package, storage, and main runs are required before
claiming stable percentile improvements.

## Package discovery and full local checks

`build:libs` and `pack:dry-run` discover every non-private package from the
shared `libs/*` npm/Lerna workspace boundary. They run sequentially,
dependency-first, stream output, fail fast, and identify the failing package.
Selected execution accepts an affected-plan file without creating another task
runner:

```sh
node tools/workspace-packages.js run \
  --script build \
  --packages-file affected-plan.json

node tools/workspace-packages.js pack \
  --dry-run \
  --packages-file affected-plan.json
```

Before a high-risk change or release, run the complete local commands listed in
the repository validation checklist and explain any environment-only skips.
Nx remains available for its existing tasks; this refactor does not remove Nx,
perform a full Nx migration, or add remote caching.
