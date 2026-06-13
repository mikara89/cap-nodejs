# Release Checklist

Releases are manual or tag-triggered. CI validates the repository; the release
workflow is the only workflow that publishes packages.

## Before Release

- Confirm CI is green for the target commit.
- Confirm there are no committed secrets or local registry credentials.
- Run the static checks:

```powershell
npm run lint:check
npm run build
npm test
npm run test:e2e
npm run pack:dry-run
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

The release workflow:

- uses Node 22
- installs with `npm ci --ignore-scripts`
- builds libraries
- verifies package contents
- publishes with Lerna using the configured npm registry secret

## After Release

- Verify packages are available in the target registry.
- Verify generated changelogs and tags are correct.
- Update `docs/roadmap.md` if release scope changes MVP/Beta/v1 status.
