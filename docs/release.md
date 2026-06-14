# Release Checklist

Releases are manual or tag-triggered. CI validates the repository; the release
workflow is the only workflow that publishes packages. The first MVP package
set should be published as beta or rc before stable graduation.

## Before Release

- Confirm CI is green for the target commit.
- Confirm there are no committed secrets or local registry credentials.
- Confirm GitHub private vulnerability reporting is enabled.
- Confirm GitHub Pages is enabled for the `/docs` folder and the repository
  About website points to `https://mikara89.github.io/cap-nestjs/`.
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
- publishes with Lerna using the configured npm registry secret

## After Release

- Verify packages are available in the target registry.
- Verify generated changelogs and tags are correct.
- Update `docs/roadmap.md` if release scope changes MVP/Beta/v1 status.
