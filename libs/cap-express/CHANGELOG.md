# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.2.0 (2026-06-26)

### Features

- pass transaction context options through Express publish helpers and expose
  the core transaction manager-backed `transaction()` helper

### Compatibility

- keep existing Express imports compiling and preserve `publish(..., { tx })`
  behavior with no expected breaking changes for transaction-handle users

# 0.7.0-beta.4 (2026-06-24)

**Note:** Version bump only for package @mikara89/cap-express

# Changelog

Initial package scaffold for `@mikara89/cap-express`.
