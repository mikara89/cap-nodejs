# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.0](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-storage-mikro-orm@2.2.0...@mikara89/cap-storage-mikro-orm@2.3.0) (2026-07-25)


### Features

* **core:** add messaging administration APIs ([#15](https://github.com/mikara89/cap-nodejs/issues/15)) ([2dc1ae9](https://github.com/mikara89/cap-nodejs/commit/2dc1ae983187d4e599ead38ee0bc814036d59ae0))
* **inbox:** recover stale pending messages during scheduled retries ([912557a](https://github.com/mikara89/cap-nodejs/commit/912557a94af07c8da4aad81aaecd41bf91815738))


### Bug Fixes

* **core:** fence outbox claim ownership ([2a381ad](https://github.com/mikara89/cap-nodejs/commit/2a381adcd8c158779e6260a058851ce378bc6209))
* **release:** restore Lerna release authority ([044f165](https://github.com/mikara89/cap-nodejs/commit/044f1658247a8ba6efb4870ca1c76610138a948e))
* **storage:** preserve retry thresholds on MySQL ([4a3579e](https://github.com/mikara89/cap-nodejs/commit/4a3579e60be55baa4a761a67126f6b52af3deff1))
* **storage:** update order by logic for received storage to prioritize failed status ([e42aa67](https://github.com/mikara89/cap-nodejs/commit/e42aa6705b4bd4864ad6ce1db3c4b92b221775bd))


### Reverts

* Revert "chore(release): prepare 2.3.0" ([de35e0e](https://github.com/mikara89/cap-nodejs/commit/de35e0ef6bec2f4aa6b94092298908be91186c11))




## Unreleased

- add guarded messaging requeue and aggregate snapshot administration support

- select stale pending inbox rows alongside due failed rows for scheduler recovery

## 2.2.0 (2026-06-26)

### Features

- add MikroORM `ctx.tx` support for transaction-aware outbox writes
- implement informational storage capabilities with conservative driver
  reporting
- cover the adapter with the shared publish-storage contract suite

### Compatibility

- keep package root exports framework-neutral and keep Nest wrappers available
  through explicit `/nest` subpaths
- keep existing `publish(..., { tx })` usage working with no expected breaking
  changes for transaction-handle users
- retain `savePublishWithTx(event, tx)` only as deprecated compatibility and
  delegate it to `savePublish(event, { tx })`

# 0.7.0-beta.4 (2026-06-24)

**Note:** Version bump only for package @mikara89/cap-storage-mikro-orm

# [0.7.0](https://github.com/mikara89/cap-nestjs/compare/@mikara89/mikroorm-storage@0.7.0-beta.3...@mikara89/mikroorm-storage@0.7.0) (2026-06-15)

**Note:** Version bump only for package @mikara89/mikroorm-storage

# [0.7.0-beta.3](https://github.com/mikara89/cap-nestjs/compare/@mikara89/mikroorm-storage@0.7.0-beta.2...@mikara89/mikroorm-storage@0.7.0-beta.3) (2026-06-15)

### Features

- enhance documentation on multi-instance durable dispatch and header injection ([7d94b97](https://github.com/mikara89/cap-nestjs/commit/7d94b974f3b24be09b7f89e412bc5316a3d26736))
- enhance inbox item processing with status tracking and error handling ([0e344be](https://github.com/mikara89/cap-nestjs/commit/0e344be60ebec7c0dc25c288753a17fa0a9417da))
- implement dynamic claim options for entity retrieval based on driver support ([e4458ec](https://github.com/mikara89/cap-nestjs/commit/e4458eca28bea9a617e3d482f18df769f31de1c6))
- update MikroORM adapter documentation and improve multi-instance support ([a4e7586](https://github.com/mikara89/cap-nestjs/commit/a4e7586a39cad35d1c467ff61a48914a5e4d86cf))

# 0.7.0-beta.2 (2026-06-14)

### Bug Fixes

- correct formatting in package.json dependencies ([abde26a](https://github.com/mikara89/cap-nestjs/commit/abde26ae6358d46818e5c808ed8d34aa15e82192))
- update package.json scripts to use 'prepack' instead of 'prepare' for build commands ([2785ecb](https://github.com/mikara89/cap-nestjs/commit/2785ecb8379feacb73c6ed4f1c87138e606fde65))

### Features

- add cap-dashboard library and update build scripts ([574b6e4](https://github.com/mikara89/cap-nestjs/commit/574b6e451a6d4dd1cd33cfc099200371d3f4b19f))
- add issue templates, contributing guide, and security policy for project structure ([91781b1](https://github.com/mikara89/cap-nestjs/commit/91781b1f1a73969ff1796ead6e229934c47a2c0b))
- add transport-nestjs-microservices library and integration tests ([25770aa](https://github.com/mikara89/cap-nestjs/commit/25770aa4b80eeec7398958cde562915be3d45ba6))
- **docs:** add GitHub Pages setup and package export surface documentation ([6342155](https://github.com/mikara89/cap-nestjs/commit/6342155364bee204684bee9960f1814caff2da39))
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library ([a1f4885](https://github.com/mikara89/cap-nestjs/commit/a1f4885324aea9c64d87f5af1d09e9346275575e))
- update release workflow and documentation for GitHub Packages integration ([7141b4c](https://github.com/mikara89/cap-nestjs/commit/7141b4c85745358bb431911efad77804498b26f6))

# [0.7.0-beta.1](https://github.com/mikara89/cap-nestjs/compare/@mikara89/mikroorm-storage@0.5.1-beta.0...@mikara89/mikroorm-storage@0.7.0-beta.1) (2026-06-14)

### Features

- add issue templates, contributing guide, and security policy for project structure ([91781b1](https://github.com/mikara89/cap-nestjs/commit/91781b1f1a73969ff1796ead6e229934c47a2c0b))
- add transport-nestjs-microservices library and integration tests ([25770aa](https://github.com/mikara89/cap-nestjs/commit/25770aa4b80eeec7398958cde562915be3d45ba6))
- **docs:** add GitHub Pages setup and package export surface documentation ([6342155](https://github.com/mikara89/cap-nestjs/commit/6342155364bee204684bee9960f1814caff2da39))

## 0.7.0-beta.0 (2026-06-14)

### Features

- align package version and peer range with the MVP beta package set

## [0.5.1-beta.0](https://github.com/mikara89/cap-nestjs/compare/@mikara89/mikroorm-storage@0.5.0...@mikara89/mikroorm-storage@0.5.1-beta.0) (2026-06-13)

### Bug Fixes

- correct formatting in package.json dependencies ([abde26a](https://github.com/mikara89/cap-nestjs/commit/abde26ae6358d46818e5c808ed8d34aa15e82192))
- update package.json scripts to use 'prepack' instead of 'prepare' for build commands ([2785ecb](https://github.com/mikara89/cap-nestjs/commit/2785ecb8379feacb73c6ed4f1c87138e606fde65))

# 0.5.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts ([574b6e4](https://github.com/mikara89/cap-nestjs/commit/574b6e451a6d4dd1cd33cfc099200371d3f4b19f))
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library ([a1f4885](https://github.com/mikara89/cap-nestjs/commit/a1f4885324aea9c64d87f5af1d09e9346275575e))

# 0.4.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts ([574b6e4](https://github.com/mikara89/cap-nestjs/commit/574b6e451a6d4dd1cd33cfc099200371d3f4b19f))
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library ([a1f4885](https://github.com/mikara89/cap-nestjs/commit/a1f4885324aea9c64d87f5af1d09e9346275575e))

# 0.3.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts ([574b6e4](https://github.com/mikara89/cap-nestjs/commit/574b6e451a6d4dd1cd33cfc099200371d3f4b19f))
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library ([a1f4885](https://github.com/mikara89/cap-nestjs/commit/a1f4885324aea9c64d87f5af1d09e9346275575e))

# 0.2.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts 574b6e4
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library a1f4885

# 0.1.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts 574b6e4
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library a1f4885
