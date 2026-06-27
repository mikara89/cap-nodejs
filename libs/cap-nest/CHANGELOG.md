# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.2.0 (2026-06-26)

### Features

- pass transaction context options through `CapService.publish()` and expose the
  `transaction()` helper backed by core transaction managers
- re-export core transaction context types for Nest consumers

### Compatibility

- keep existing Nest imports compiling and preserve `publish(..., { tx })`
  behavior with no expected breaking changes for transaction-handle users

## [0.7.1-beta.0](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-nest@0.7.0...@mikara89/cap-nest@0.7.1-beta.0) (2026-06-24)

**Note:** Version bump only for package @mikara89/cap-nest

# [0.7.0](https://github.com/mikara89/cap-nestjs/compare/@mikara89/cap-nest@0.7.0-beta.3...@mikara89/cap-nest@0.7.0) (2026-06-15)

**Note:** Version bump only for package @mikara89/cap-nest

# [0.7.0-beta.3](https://github.com/mikara89/cap-nestjs/compare/@mikara89/cap-nest@0.7.0-beta.2...@mikara89/cap-nest@0.7.0-beta.3) (2026-06-15)

### Features

- add warnings for multi-instance durable outbox dispatch requirements in documentation and improve deduplication logic in storage ([29f2f22](https://github.com/mikara89/cap-nestjs/commit/29f2f223327ca912dfbf134639c23feaab1c9fa9))
- enhance documentation on multi-instance durable dispatch and header injection ([7d94b97](https://github.com/mikara89/cap-nestjs/commit/7d94b974f3b24be09b7f89e412bc5316a3d26736))
- enhance inbox item processing with status tracking and error handling ([0e344be](https://github.com/mikara89/cap-nestjs/commit/0e344be60ebec7c0dc25c288753a17fa0a9417da))

# 0.7.0-beta.2 (2026-06-14)

### Bug Fixes

- correct formatting in package.json dependencies ([abde26a](https://github.com/mikara89/cap-nestjs/commit/abde26ae6358d46818e5c808ed8d34aa15e82192))
- update package.json scripts to use 'prepack' instead of 'prepare' for build commands ([2785ecb](https://github.com/mikara89/cap-nestjs/commit/2785ecb8379feacb73c6ed4f1c87138e606fde65))

### Features

- add cap-dashboard library and update build scripts ([574b6e4](https://github.com/mikara89/cap-nestjs/commit/574b6e451a6d4dd1cd33cfc099200371d3f4b19f))
- add CapExampleHandler and integrate with CapTestAppController for message publishing ([7d3fa48](https://github.com/mikara89/cap-nestjs/commit/7d3fa4896850c0c6e4b581234587ce4168989f45))
- add issue templates, contributing guide, and security policy for project structure ([91781b1](https://github.com/mikara89/cap-nestjs/commit/91781b1f1a73969ff1796ead6e229934c47a2c0b))
- add transport-nestjs-microservices library and integration tests ([25770aa](https://github.com/mikara89/cap-nestjs/commit/25770aa4b80eeec7398958cde562915be3d45ba6))
- **docs:** add GitHub Pages setup and package export surface documentation ([6342155](https://github.com/mikara89/cap-nestjs/commit/6342155364bee204684bee9960f1814caff2da39))
- enhance CAP integration tests and improve code quality ([34f4639](https://github.com/mikara89/cap-nestjs/commit/34f4639534a17bb2b5cb844d00025c56044f2ab1))
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library ([a1f4885](https://github.com/mikara89/cap-nestjs/commit/a1f4885324aea9c64d87f5af1d09e9346275575e))
- update documentation and remove deprecated variables in CAP for NestJS API ([5c25f11](https://github.com/mikara89/cap-nestjs/commit/5c25f114f6cb7ac1007ba29e7cd42e53360d5943))
- update release workflow and documentation for GitHub Packages integration ([7141b4c](https://github.com/mikara89/cap-nestjs/commit/7141b4c85745358bb431911efad77804498b26f6))

# [0.7.0-beta.1](https://github.com/mikara89/cap-nestjs/compare/@mikara89/cap-nest@0.5.1-beta.0...@mikara89/cap-nest@0.7.0-beta.1) (2026-06-14)

### Features

- add issue templates, contributing guide, and security policy for project structure ([91781b1](https://github.com/mikara89/cap-nestjs/commit/91781b1f1a73969ff1796ead6e229934c47a2c0b))
- add transport-nestjs-microservices library and integration tests ([25770aa](https://github.com/mikara89/cap-nestjs/commit/25770aa4b80eeec7398958cde562915be3d45ba6))
- **docs:** add GitHub Pages setup and package export surface documentation ([6342155](https://github.com/mikara89/cap-nestjs/commit/6342155364bee204684bee9960f1814caff2da39))

## 0.7.0-beta.0 (2026-06-14)

### Features

- add first-class primitive header propagation and `@CapHeaders()`
- align transport contracts for header-aware publish/consume flows

## [0.5.1-beta.0](https://github.com/mikara89/cap-nestjs/compare/@mikara89/cap-nest@0.5.0...@mikara89/cap-nest@0.5.1-beta.0) (2026-06-13)

### Bug Fixes

- correct formatting in package.json dependencies ([abde26a](https://github.com/mikara89/cap-nestjs/commit/abde26ae6358d46818e5c808ed8d34aa15e82192))
- update package.json scripts to use 'prepack' instead of 'prepare' for build commands ([2785ecb](https://github.com/mikara89/cap-nestjs/commit/2785ecb8379feacb73c6ed4f1c87138e606fde65))

# 0.5.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts ([574b6e4](https://github.com/mikara89/cap-nestjs/commit/574b6e451a6d4dd1cd33cfc099200371d3f4b19f))
- add CapExampleHandler and integrate with CapTestAppController for message publishing ([7d3fa48](https://github.com/mikara89/cap-nestjs/commit/7d3fa4896850c0c6e4b581234587ce4168989f45))
- enhance CAP integration tests and improve code quality ([34f4639](https://github.com/mikara89/cap-nestjs/commit/34f4639534a17bb2b5cb844d00025c56044f2ab1))
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library ([a1f4885](https://github.com/mikara89/cap-nestjs/commit/a1f4885324aea9c64d87f5af1d09e9346275575e))

# 0.4.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts ([574b6e4](https://github.com/mikara89/cap-nestjs/commit/574b6e451a6d4dd1cd33cfc099200371d3f4b19f))
- add CapExampleHandler and integrate with CapTestAppController for message publishing ([7d3fa48](https://github.com/mikara89/cap-nestjs/commit/7d3fa4896850c0c6e4b581234587ce4168989f45))
- enhance CAP integration tests and improve code quality ([34f4639](https://github.com/mikara89/cap-nestjs/commit/34f4639534a17bb2b5cb844d00025c56044f2ab1))
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library ([a1f4885](https://github.com/mikara89/cap-nestjs/commit/a1f4885324aea9c64d87f5af1d09e9346275575e))

# 0.3.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts ([574b6e4](https://github.com/mikara89/cap-nestjs/commit/574b6e451a6d4dd1cd33cfc099200371d3f4b19f))
- add CapExampleHandler and integrate with CapTestAppController for message publishing ([7d3fa48](https://github.com/mikara89/cap-nestjs/commit/7d3fa4896850c0c6e4b581234587ce4168989f45))
- enhance CAP integration tests and improve code quality ([34f4639](https://github.com/mikara89/cap-nestjs/commit/34f4639534a17bb2b5cb844d00025c56044f2ab1))
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library ([a1f4885](https://github.com/mikara89/cap-nestjs/commit/a1f4885324aea9c64d87f5af1d09e9346275575e))

# 0.2.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts 574b6e4
- add CapExampleHandler and integrate with CapTestAppController for message publishing 7d3fa48
- enhance CAP integration tests and improve code quality 34f4639
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library a1f4885

# 0.1.0 (2025-11-23)

### Features

- add cap-dashboard library and update build scripts 574b6e4
- add CapExampleHandler and integrate with CapTestAppController for message publishing 7d3fa48
- enhance CAP integration tests and improve code quality 34f4639
- **storage-mikro-orm:** add MikroORM storage adapter for CAP NestJS library a1f4885
