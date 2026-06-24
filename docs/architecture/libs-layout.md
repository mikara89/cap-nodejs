# Future Libs Layout

This page documents a future workspace layout proposal only. The v2.1.1
release keeps the current flat workspace layout.

## Current v2.1.1 Layout

```txt
libs/
  cap-core/
  cap-testing/
  cap-nest/
  cap-express/
  cap-storage-mikro-orm/
  cap-transport-azure-servicebus/
  cap-transport-nestjs-microservices/
  cap-dashboard-core/
  cap-dashboard-nest/
  cap-dashboard-express/
  cap-dashboard/
```

Do not physically move package folders in v2.1.1. A folder move would touch npm
workspaces, TypeScript paths, Jest module mapping, TypeDoc entry points, Lerna
package discovery, examples, docs, package `repository.directory` fields, and
release packaging. That is too much migration risk for a patch focused on
release readiness and security hardening.

## Recommended Future Grouping

If the project later accepts a workspace-layout migration, group packages by
role while keeping every package folder name prefixed with `cap-`:

```txt
libs/
  core/
    cap-core/
    cap-testing/

  frameworks/
    cap-nest/
    cap-express/

  storage/
    cap-storage-mikro-orm/

  transports/
    cap-transport-azure-servicebus/
    cap-transport-nestjs-microservices/

  dashboard/
    cap-dashboard-core/
    cap-dashboard-nest/
    cap-dashboard-express/
    cap-dashboard/
```

Published package names stay unchanged. The folder grouping is only a workspace
organization change.

## Proposed Groups

| Group | Packages |
| --- | --- |
| Core | `cap-core`, `cap-testing` |
| Frameworks | `cap-nest`, `cap-express` |
| Storage | `cap-storage-mikro-orm` |
| Transports | `cap-transport-azure-servicebus`, `cap-transport-nestjs-microservices` |
| Dashboard | `cap-dashboard-core`, `cap-dashboard-nest`, `cap-dashboard-express`, `cap-dashboard` |

## Workspace Pattern

The workspace configuration would move from:

```json
{
  "workspaces": ["libs/*"]
}
```

to:

```json
{
  "workspaces": ["libs/*/*"]
}
```

## Package Internal Shape

Publishable packages should keep predictable internal boundaries:

```txt
src/
  index.ts
  public-api.ts
  <domain>/
  options/
  testing/
  nest/
  express/
```

Use `nest/` only when a package has Nest integration and `express/` only when a
package has Express integration. Framework-free package roots should not export
framework wrappers.

## Future Migration Plan

Do a physical regrouping only in a separate layout PR:

1. Move package folders into grouped directories.
2. Change npm workspaces to `libs/*/*`.
3. Update TypeScript paths.
4. Update Jest `moduleNameMapper`.
5. Update TypeDoc entry points.
6. Update Lerna configuration if needed.
7. Update package `repository.directory` fields.
8. Update docs and examples.
9. Run the full release-readiness gate.
