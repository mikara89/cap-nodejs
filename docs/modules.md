# Modules & Key Components

This page describes the main modules and their responsibilities.

- `CapModule` — public entrypoint. Builders:
  - `forInMemory()` — in-memory storage + local bus transport (useful for tests
    and examples).
  - `forAdapters(storageModule, transportModule)` — accepts adapter modules that
    export provider arrays.
  - `forRoot({ storage, transport })` — accepts raw provider lists.

- `CapService` — facade that orchestrates persistence and transport. Key
  responsibilities:
  - `publish(topic, payload)` — persist then attempt to publish via
    `IPublisher`.
  - `subscribe(topic, group, handler, filter?)` — register handlers (used by the
    scanner and tests).
  - `tryHandle()` / `persistReceived()` — helper functions for handler
    invocation and retry scheduling.

- `CapSubscriberScanner` — OnModuleInit scanner that discovers `@CapSubscribe`
  methods and registers them with `CapService`.

- `RetrySchedulerService` — cron-based scheduler that flushes the outbox and
  retries due inbox records. Uses exponential backoff with jitter from
  `backoff.util`.

- `@CapSubscribe` decorator & `discoverSubscriptions` — annotate instance
  methods as message handlers. The scanner uses metadata created by this
  decorator.

- `CapValidatePipe` — optional validation pipe that transforms and validates
  incoming payloads into DTOs.
