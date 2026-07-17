# npm and GitHub Release Guide

CAP publishes only to `https://registry.npmjs.org/`. Lerna 9 in independent
mode is the sole version calculator, changelog generator, tag creator, npm
publisher, and GitHub release source.

For day-to-day development validation, see
[docs/development-validation.md](./development-validation.md).

Pull-request CI may use the affected fast path, but pushes to `main` and this
manual release workflow always run complete repository validation. The
affected planner never replaces release candidate selection, Lerna versioning,
environment approval, OIDC publication, tag creation, or the release workflow's
independent safety gate.

The verified toolchain is Lerna 9.0.7 with
`conventional-changelog-conventionalcommits` 7.0.2. The explicit preset is
required because Lerna's bundled Angular preset does not treat a bang header as
a breaking change in this installed version.

## Release invariants

- Package manifests always contain the last published version before a normal
  release. Contributors never prepare speculative synchronized versions.
- `fix:` produces a patch, `feat:` produces a minor, and a bang header or
  `BREAKING CHANGE:` footer produces a major.
- Commits without release semantics are filtered before Lerna runs. Lerna still
  calculates every selected version.
- Internal CAP packages use ordinary semver dependencies. This lets Lerna bump
  only dependents whose published range would become incompatible.
- Independent tags and GitHub releases use the complete
  `@mikara89/package@version` name, including beta or RC suffixes.
- Stable packages use `latest`; beta and RC packages use only their matching
  `beta` or `rc` dist-tag.
- `.github/workflows/release.yml` is manual, serialized by concurrency, and
  publishes only after the protected `npm-production` environment is approved.
- Before approval and again immediately before publication, the release tool
  simulates Lerna's versioning in a temporary checkout. The generated
  independent-version state must pass release configuration plus
  manifest/lockfile validation; any failure aborts before Lerna can publish,
  create a release commit, or push tags. The private root roadmap version is
  deliberately not a package-version baseline.

## One-time baseline bootstrap

Bootstrap is for establishing genuinely missing independent package baselines;
it is not the normal release path. The planner reads current
`https://registry.npmjs.org/` metadata, downloads existing tarballs, verifies
their SRI and SHA-1 hashes and embedded package identity, confirms that each
recorded commit contains the matching package/version, and restores the
independent annotated tags Lerna expects:

```text
@mikara89/cap-core@<version>
@mikara89/cap-testing@<version>
...one @mikara89/<package>@<version> tag per published package
```

Each tag points to the npmjs-recorded `gitHead`. Bootstrap fails if an existing
tag points anywhere else, if the commit is absent, or if the matching package
did not exist at that commit. An existing npmjs version is never rebuilt or
republished from changed local source.

For a genuinely new package, the planner records the validated HEAD as its
artifact source and publishes it with:

```sh
npx lerna publish from-package --yes \
  --registry https://registry.npmjs.org/ --dist-tag latest \
  --git-head <validated-main-sha>
```

Lerna publishes only npm-missing versions in dependency order and never derives
new bootstrap versions. The workflow re-downloads and verifies a new artifact,
requires its npmjs `gitHead` to equal the approved source commit, and creates
that package's baseline tag only after publication succeeds. If a package
existed in historical `v2.2.0` but is missing from npmjs, automation refuses to
rebuild it: the exact historical artifact must be mirrored instead.

Run the workflow with:

- `operation=bootstrap`
- `channel=stable`
- `coordinated_major=false`
- `confirmation=PUBLISH_ALL_TO_NPM`

Generate and inspect a bootstrap plan before selecting this operation. Do not
assume bootstrap is appropriate merely because a package is new to the v2.4
milestone; stop if the planner rejects the current registry or tag state.

Use a temporary granular `NPM_TOKEN` only if trusted publishing cannot create
the initial packages. After bootstrap, configure every npm package's trusted
publisher for repository `mikara89/cap-nodejs`, workflow `release.yml`, and
environment `npm-production`; then remove and revoke the token.

The transition from the old fixed `v2.2.0` tag is deliberate: the global tag
remains historical, while independent tags at each package's npm `gitHead`
become Lerna's per-package Conventional Commits boundary. Already published
commits are therefore excluded from future recommendations.

## Integration gates

Heavy transport integration gates (RabbitMQ, Kafka, AWS SNS/SQS, Azure Service
Bus) are manual/on-request by default because they require Docker containers or
cloud credentials. Unit tests, contract tests, pack smoke tests, and all other
validation remain always-on.

The release workflow exposes boolean inputs for each transport:

- `run_rabbitmq_integration` (default `false`)
- `run_kafka_integration` (default `false`)
- `run_aws_sns_sqs_integration` (default `false`)
- `run_servicebus_integration` (default `false`)

Before a final GA release, maintainers should run all transport integration
gates manually by setting each input to `true`.

## Closing the v2.4 transport milestone

The defined v2.4 feature scope is **implemented in the repository**. The
milestone is not **release verified** until the package-specific registry, tag,
tarball, installation, and broker checks below succeed. A package can be
implemented without being published to npm, and a release can be prepared
without being verified.

Packages use independent versions. The root v2.4 roadmap milestone does not
require every package to become `2.4.0`; a new transport takes its first
appropriate independent release. Unchanged packages must not be bumped, and a
dependent is bumped only when compatibility or its dependency range requires
it. Normal independent releases must not use `--force-publish`.

### 1. Establish the repository candidate

```sh
git fetch origin --prune --tags
git checkout main
git pull --ff-only origin main
git rev-parse HEAD
git status --short
```

Record the full candidate SHA, require a clean worktree, and confirm required CI
for that exact SHA before planning publication.

### 2. Validate the repository state

```sh
npm ci --package-lock=true
npm run lint:check
npm run packages:verify
npm run release:verify
npm run test:release-tooling
npm run build
npm test --silent
npm run test:e2e -- --runInBand
npm run test:integration:db
npm run examples:check
npm run docs:api
npm run pack:dry-run
```

The dry-pack output is part of approval evidence: inspect the file list,
package identity, version, dependencies, exports, and absence of fixtures,
generated test clients, credentials, and repository-only tooling.

### 3. Run transport validation at the correct boundary

Contract tests, package installation smoke tests, and real-provider integration
tests prove different things:

- `npm test --silent` includes the adapter-neutral transport contract tests.
- `npm run pack:smoke:rabbitmq`, `npm run pack:smoke:kafka`, and
  `npm run pack:smoke:aws-sns-sqs` install locally packed artifacts and verify
  their consumer-facing import/type surfaces.
- `npm run test:integration:rabbitmq`, `npm run test:integration:kafka`, and
  `npm run test:integration:aws-sns-sqs` exercise real Docker-backed brokers or
  provider emulation.
- `npm run test:integration:servicebus` exercises Azure Service Bus and requires
  `SERVICEBUS_CONNECTION_STRING`.

The manual release workflow exposes matching `run_*_integration` inputs. Set
the relevant RabbitMQ, Kafka, AWS SNS/SQS, and Azure Service Bus inputs to
`true` for final closure; a skipped real-provider gate is not evidence that it
passed.

### 4. Inspect the public npm state

For each package, query the public registry rather than inferring publication
from repository source or a manifest:

```sh
npm view <package> version --json \
  --registry=https://registry.npmjs.org/
npm view <package> dist-tags --json \
  --registry=https://registry.npmjs.org/
npm view <package>@<version> gitHead \
  --registry=https://registry.npmjs.org/
```

Apply the checks to at least:

```text
@mikara89/cap-core
@mikara89/cap-nest
@mikara89/cap-express
@mikara89/cap-testing
@mikara89/cap-transport-nestjs-microservices
@mikara89/cap-transport-rabbitmq
@mikara89/cap-transport-kafka
@mikara89/cap-transport-aws-sns-sqs
```

Record missing packages separately from registry or network errors. Registry
results are operational evidence and must not be copied into manifests or kept
as a dated snapshot in this guide.

### 5. Generate and inspect the release plan

For a normal stable independent release, use the same planner inputs as the
manual workflow:

```sh
node tools/release-tool.js plan \
  --operation release \
  --channel stable \
  --coordinated-major false \
  --confirmation "" \
  --output release-plan.generated.json
```

Inspect every selected package, old and proposed version, npm dist-tag, package
tag, and GitHub release name. Stop if an unrelated or unchanged package appears.
Do not execute the plan merely because generation succeeded.

Bootstrap is only for establishing or restoring an independent package
baseline, including a new unpublished package at its current manifest version
or an already-published package whose verified baseline tag must be restored.
Use it only when the current planner accepts the repository, registry, artifact,
and tag state:

```sh
node tools/release-tool.js plan \
  --operation bootstrap \
  --channel stable \
  --coordinated-major false \
  --confirmation PUBLISH_ALL_TO_NPM \
  --output bootstrap-plan.generated.json
```

Do not substitute coordinated versions or `--force-publish` for a rejected
normal plan. The release workflow recalculates the plan on validated `main`,
uploads it for inspection, and pauses the publish job at the protected
`npm-production` environment. Approve only the reviewed package plan; the
workflow then rechecks the exact SHA and plan before publication.

### 6. Verify each publication

For every package selected by the approved plan:

1. Repeat the npm `version`, `dist-tags`, and `gitHead` queries and confirm the
   intended version and `latest` or prerelease dist-tag.
2. Resolve `git rev-list -n 1 "@mikara89/<package>@<version>"` and require the
   package tag target to match npm `gitHead`.
3. Download the exact published tarball in a temporary directory with
   `npm pack <package>@<version> --json --registry=https://registry.npmjs.org/`,
   inspect its contents and identity, and then delete the archive.
4. Create a new empty consumer project and install only the published package
   and its documented peer dependencies from the public registry. Verify its
   root and documented subpath imports.
5. For each newly published RabbitMQ, Kafka, or AWS SNS/SQS transport, run the
   package README's minimal publisher/subscriber flow from that isolated
   consumer against the corresponding real integration environment. Record one
   successfully published and consumed message, including successful settlement.

Only after these checks pass is that package **release verified**. Close the
v2.4 milestone only when every package in the approved closure plan is verified;
planned or deferred Event Hubs compatibility, NATS, Pub/Sub, and richer
capability work are not closure blockers.

## Normal releases

Run `operation=release`, `coordinated_major=false`, and choose a channel.
The stable command is:

```sh
npx lerna publish --conventional-commits --create-release github --yes \
  --registry https://registry.npmjs.org/ --dist-tag latest
```

Beta adds `--conventional-prerelease --preid beta --dist-tag beta`; RC adds
`--conventional-prerelease --preid rc --dist-tag rc`. Verified Lerna
configuration ignores package-local tests, fixtures, Markdown, and explicitly
test-, lint-, or documentation-only TypeScript configurations. It does not use
a blanket `tsconfig*.json` rule: `tsconfig.json`, `tsconfig.build.json`, and
`tsconfig.lib.json` are build-consumed and therefore release-significant.
Runtime source, public declarations, exports and entry points, runtime and peer
dependencies, artifact-affecting package metadata, `.npmignore`, included
schemas/migrations, and other packed-artifact inputs are package-owned release
paths. README files, changelogs, tests, fixtures, and documentation alone are
not.

The planner rejects publishable package changes that have no release-signaling
commit, then lets Lerna select packages and calculate versions. It explicitly
forces only stable-release dependents whose internal range would otherwise
become invalid. A prerelease never pulls unchanged stable packages into beta or
RC merely to widen their ranges. No-change requests succeed without publishing.

Package changelog ownership is path-based, not scope-based. Lerna loads the
repository-private package-owned Conventional Commits preset and generates each
independent package section while retaining only commits that change an
artifact-significant path in that package. The release tool then validates
every generated commit reference against the same policy. Lerna calculates
versions, generates changelogs, creates tags, and publishes. This keeps valid
package fixes, features, breaking-change notes, and package-owned reverts while
excluding root, documentation-only, test-only, and sibling-package commits.
Existing published changelog sections are historical artifacts and are never
rewritten.

For example, a root-only commit such as:

```text
fix(release): adjust workflow
```

that touches only `tools/**` or `.github/**` releases no package and appears in
no package changelog. Conversely:

```text
fix(storage-knex): correct transaction behavior
```

that changes Knex runtime source releases only Knex and appears only in Knex's
changelog; the scope is descriptive, while the changed package path is the
ownership proof.

Commit attribution to packages uses changed file paths, not Conventional Commit
scopes. A path is classified by the single `isArtifactSignificantPath` policy
in `tools/release-tool.js`, which is also the classifier used by bootstrap
artifact comparison, release-signal validation, and generated-changelog
validation.
Paths are divided into three categories:

- **Artifact-significant** (release-significant): runtime source, public
  declarations, package exports, entry points, runtime and peer dependencies,
  `.npmignore`, build-consumed TypeScript configuration (`tsconfig.json`,
  `tsconfig.build.json`, `tsconfig.lib.json`), schema or migration files
  included in the package, and any other files affecting the packed artifact.

- **Non-release-significant by themselves**: `README.md`, `CHANGELOG.md`, unit
  tests, integration tests, contract tests, fixtures, test-only configuration,
  lint-only configuration, API documentation output, and package-local docs
  that do not alter runtime artifacts. Test- and lint-only tsconfig files
  (`tsconfig.eslint.json`, `tsconfig.lint.json`, `tsconfig.test.json`,
  `tsconfig.spec.json`, `tsconfig.typedoc.json`) are explicitly excluded.

- **Repository-only** (never release a package): `.github/**`, `tools/**`, root
  release documentation, root roadmap documentation, private root version
  changes, release-plan files, CI-only files, and repository administration.

Revert commits are attributed to the package whose behavior they revert, based
on the changed paths in the revert commit itself (not the original commit).

An illustrative progression for one independently versioned package is:

```text
2.3.0
2.4.0-beta.0
2.4.0-beta.1
2.4.0-rc.0
2.4.0-rc.1
2.4.0
```

Changing beta to RC must keep the same base version. A stable release never
implicitly graduates a prerelease.

## Graduation

Run:

- `operation=graduate`
- `channel=stable`
- `coordinated_major=false`

The workflow uses `--conventional-graduate`, selects only packages currently
on prerelease versions, removes the suffix without another feature bump, and
publishes with `latest`. Graduation fails when no prerelease exists.

## Coordinated major

This mode is only for a breaking contract shared by every package. Every
coordinated operation requires:

```text
coordinated_major=true
confirmation=PUBLISH_COORDINATED_MAJOR
```

This exceptional mode is not part of v2.4 closure and must not be used merely
to synchronize package versions with the roadmap milestone.

- Stable uses explicit `major --force-publish=*` and `latest`.
- Beta uses explicit `premajor --preid beta --force-publish=*` and `beta`.
- RC uses explicit `prerelease --preid rc --force-publish=*` and is accepted
  only when every package already belongs to the coordinated beta line.
- Graduation uses `--conventional-graduate=*` with
  `--force-conventional-graduate` and requires every package to be a
  coordinated prerelease participant.

The planner verifies every proposed major/premajor before approval; it never
assumes that `--force-publish` changes the semantic bump.

## Approval and repository security

The validation job checks out full history, records HEAD, tests the release
tooling, prints packages, old/proposed versions, dist-tag, tags, GitHub releases,
and runs every product/package gate. Planning and execution both require a clean
worktree. Its integrity-protected plan is uploaded for one day.

The publish job starts only after `npm-production` approval. It checks out
`main` with full history, requires local HEAD and `origin/main` to equal the
validated SHA, and performs a dry-run push before Lerna can create versions.
Configure branch protection or repository rules so
`github-actions[bot]` may push the Lerna version commit and annotated tags.
Lerna pushes before npm publication, so a denied branch push cannot leave npm
ahead of Git.

The job grants `contents: write` for commits, tags, and GitHub releases,
`id-token: write` for npm OIDC, and passes `GH_TOKEN` from
`secrets.GITHUB_TOKEN`.

As audited on 2026-06-28, GitHub's public branch endpoint reports
`main.protected=false` and the repository rulesets endpoint returns no rulesets.
With the workflow's explicit `contents: write`, `GITHUB_TOKEN` can therefore
push the Lerna version commit, push annotated package tags, and create GitHub
releases. The release preflight also requires a successful branch-push dry run.

Re-audit those settings before enabling protection. If a branch or tag ruleset
later blocks the Actions token, either grant a narrowly scoped GitHub App a
documented ruleset bypass or change to a release-PR workflow in which the
version commit is reviewed and merged before `lerna publish from-git`. Do not
solve this with an unreviewed long-lived personal access token.

## Recovery

Never create a new version merely to retry a partial release.

- If npm fails after Lerna pushed the version commit and tags, fix
  authentication/registry availability and retry:

  Run the `Release` workflow with operation `recover`, the original channel,
  the full SHA of the tagged release commit in `recovery_ref`, and confirmation
  `RECOVER_PARTIAL_RELEASE`. The protected workflow validates that the commit is
  still an ancestor of `main`, checks out that exact tag target, and then uses
  npm OIDC to run the equivalent of:

  ```sh
  npx lerna publish from-git --yes \
    --registry https://registry.npmjs.org/ --dist-tag latest
  ```

  Use `beta` or `rc` instead of `latest` for prerelease tags.

- If bootstrap publication is partial, rerun the same bootstrap operation;
  `from-package` skips versions already on npm.
- If npm succeeded but a GitHub release is missing, recreate it from the
  existing annotated tag with `gh release create <tag> --verify-tag`. Do not
  change package versions or tags.

## Validation

```sh
npm install
npm audit --omit=dev
npm run packages:list
npm run packages:verify
npm run release:verify
npm run release:baseline
npm run test:release-tooling
npm run lint:check
npm run build
npm run examples:check
npm run docs:api
npm test -- --runInBand
npm run test:integration:db
npm run pack:dry-run
```

The database gate requires a Docker-compatible runtime. Review dry-pack
manifests before approval.
