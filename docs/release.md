# Release Checklist

Releases are manual or tag-triggered. CI validates the repository; the release
workflow is the only workflow that publishes packages. Packages are published to
GitHub Packages at `https://npm.pkg.github.com`. The first MVP package set
should be published as beta or rc before stable graduation.

## Before Release

- Confirm CI is green for the target commit.
- Confirm there are no committed secrets or local registry credentials.
- Confirm GitHub private vulnerability reporting is enabled.
- Confirm GitHub Pages is enabled for the `/docs` folder and the repository
  About website points to `https://mikara89.github.io/cap-nestjs/`.
- Confirm the GitHub Packages namespace is ready. The current package names use
  the `@mikara89` npm scope, matching the current repository owner.
- Confirm Actions has `packages: write` permission and the repository setting
  allows GitHub Actions to write packages.
- Run the static checks:

```powershell
npm run lint:check
npm run build
npm test
npm run test:e2e
npm run pack:dry-run
```

- Run the external Azure Service Bus gate when a real namespace or emulator is
  available:

```powershell
npm run test:integration:servicebus
```

- Review package dry-run output and confirm each package includes only expected
  files.
- Confirm dashboard package output includes `dist/public/index.html`,
  `dist/public/main.js`, and `dist/public/styles.css`.
- Review package versions, peer dependency ranges, and changelogs.

## Publish

Use one release path only:

- push a version tag matching `v*`, or
- run the Release workflow manually from GitHub Actions

Manual releases support `beta`, `rc`, and `stable` channels. `v*` tags publish
as stable. Use `graduate` only when promoting existing prereleases to stable.

The release workflow:

- uses Node 22
- installs with `npm ci`
- builds libraries
- verifies package contents
- publishes with Lerna to GitHub Packages
- authenticates with the workflow `GITHUB_TOKEN`; no `NPM_TOKEN` secret is
  required for this repository-owned package release

## After Release

- Verify packages are available in GitHub Packages.
- Set package visibility/access in GitHub Packages after the first publish.
- Verify generated changelogs and tags are correct.
- Update `docs/roadmap.md` if release scope changes MVP/Beta/v1 status.

## Installing From GitHub Packages

Consumers need npm configured for the package scope:

```powershell
npm config set @mikara89:registry https://npm.pkg.github.com
```

GitHub Packages may require authentication for installs, including public
packages. If npm returns `401` or `403`, authenticate with a GitHub personal
access token that has `read:packages` access:

```powershell
npm login --scope=@mikara89 --auth-type=legacy --registry=https://npm.pkg.github.com
```
