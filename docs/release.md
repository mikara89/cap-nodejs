# npm and GitHub Release Guide

CAP publishes only to `https://registry.npmjs.org/`. Lerna 9 in independent
mode is the sole version calculator, changelog generator, tag creator, npm
publisher, and GitHub release source.

For day-to-day development validation, see
[docs/development-validation.md](./development-validation.md).

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

npmjs currently records `2.2.0` for all 14 packages with npmjs registry
`gitHead` `65f0c11f2cac774da8bd7068e277d25c6ed588b3`. This value comes from
`https://registry.npmjs.org/` metadata, not GitHub Packages. The npmjs tarballs
for all 14 packages—including Knex, TypeORM, and Prisma—already exist. Bootstrap
downloads them, verifies their SRI and SHA-1 hashes and embedded package
identity, confirms the recorded commit contains the matching package/version,
and then restores the independent annotated tags Lerna expects:

```text
@mikara89/cap-core@2.2.0
@mikara89/cap-testing@2.2.0
...one @mikara89/<package>@2.2.0 tag per published package
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

Use a temporary granular `NPM_TOKEN` only if trusted publishing cannot create
the initial packages. After bootstrap, configure every npm package's trusted
publisher for repository `mikara89/cap-nodejs`, workflow `release.yml`, and
environment `npm-production`; then remove and revoke the token.

The transition from the old fixed `v2.2.0` tag is deliberate: the global tag
remains historical, while the 14 independent tags at the npm `gitHead` become
Lerna's per-package Conventional Commits boundary. Already released commits are
therefore excluded from future recommendations.

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

Package changelog ownership is path-based, not scope-based. Lerna generates
each independent package section from that package's changed paths, while the
release tool validates every generated commit reference against the same
artifact-significance policy. Lerna calculates versions, generates changelogs,
creates tags, and publishes. This keeps valid package fixes, features,
breaking-change notes, and package-owned reverts while excluding root and
sibling-package commits. Existing published changelog sections are historical
artifacts and are never rewritten.

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
scopes.  A path is classified by the single `isArtifactSignificantPath` policy
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
  that do not alter runtime artifacts.  Test- and lint-only tsconfig files
  (`tsconfig.eslint.json`, `tsconfig.lint.json`, `tsconfig.test.json`,
  `tsconfig.spec.json`, `tsconfig.typedoc.json`) are explicitly excluded.

- **Repository-only** (never release a package): `.github/**`, `tools/**`, root
  release documentation, root roadmap documentation, private root version
  changes, release-plan files, CI-only files, and repository administration.

Revert commits are attributed to the package whose behavior they revert, based
on the changed paths in the revert commit itself (not the original commit).

Expected progression:

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
