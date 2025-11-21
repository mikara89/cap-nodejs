# Architecture — CAP NestJS Library

Core concepts

- Outbox / Inbox: messages are persisted before transport attempts. Outbox holds
  pending publishes; inbox (received) stores deliveries for handler execution
  and retries.
- Transport abstraction: `IPublisher` and `ISubscriber` tokens decouple
  transport implementation (Rabbit, Kafka, in-memory LocalBus).
- Storage abstraction: `IPublishStorage` and `IReceivedStorage` tokens abstract
  persistence for outbox/inbox.
- Scheduler: cron-based retrying of outbox and inbox entries using exponential
  backoff with jitter.

High-level flow

1. `CapService.publish()` persists a `CapPublishEvent` then attempts transport
   via `IPublisher.emit()`.
2. On success, storage is marked `published`; on failure, the outbox entry
   remains to be retried by the scheduler.
3. `ISubscriber.consume()` delivers inbound messages; handlers decorated with
   `@CapSubscribe` get discovered by the scanner and executed. Failures schedule
   retries on the `IReceivedStorage`.

Design notes

- Symbol-based tokens are used for DI to enable adapter modules to wire in
  provider implementations without direct coupling.
- The scanner uses Nest `ModulesContainer` + `Reflector` to discover decorated
  methods at startup and register them with `CapService`.
