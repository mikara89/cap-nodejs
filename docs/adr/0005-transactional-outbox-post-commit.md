# ADR 0005: Prefer Transactional Outbox With Post-Commit Publishing

## Status

Accepted

## Context

Applications often need a domain change and an outbox message to commit
atomically. Emitting to a broker before a database transaction commits can
publish messages for data that later rolls back.

## Decision

CAP supports transactional outbox persistence through optional adapter
capabilities such as `savePublishWithTx`. When a transaction is provided but the
publisher cannot participate in that transaction, CAP should defer immediate
emission and leave the outbox row for post-commit publication by the scheduler
or application-level post-commit handling.

## Consequences

- Storage adapters can opt into transaction-aware outbox writes.
- `publish(..., { tx })` defers broker emission by default; `immediate: true`
  is explicit and non-atomic.
- The recommended production pattern is to persist the outbox record inside the
  domain transaction and publish after commit.
- Applications may use `withTransactionAndPostCommit` for explicit post-commit
  send workflows.

## Links

- [Architecture](../architecture.md)
- [Adapters](../adapters.md)
