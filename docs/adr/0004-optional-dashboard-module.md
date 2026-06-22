# ADR 0004: Ship the Dashboard as an Optional Module

## Status

Accepted

## Context

Operators need to inspect outbox and inbox state and occasionally trigger manual
actions. Not every application should expose an admin surface, and dashboard
security belongs to the host application.

## Decision

CAP ships dashboard functionality as a separate optional package,
`@mikara89/cap-dashboard-nest`. Applications opt in by importing `CapDashboardModule` and
must provide a NestJS guard.

## Consequences

- Core messaging does not depend on dashboard code.
- Applications can omit the dashboard entirely.
- Dashboard endpoints can reuse the existing storage abstractions.
- The dashboard package must document its security and operational risks
  clearly.

## Links

- [Dashboard](../cap-dashboard.md)
- [Roadmap](../roadmap.md)
