# Transport Adapter Author Guide

Transport adapters connect CAP's framework-neutral publish and subscribe ports
to a broker client or framework bridge. Keep broker types, delivery handles,
acknowledgement APIs, and topology objects inside the adapter.

## Verified Public Contract

The current contract is the surface already exported by `cap-core`:

- `PublisherPort.emit(topic, payload, headers?, metadata?)` publishes one
  message and rejects when the client operation fails.
- `PublishMetadata.messageId` carries the stable CAP outbox identity.
- `PublisherPort.initialize(options?)` is optional.
- `SubscriberPort.consume(topic, group, handler)` registers a group-aware
  inbound handler.
- The handler receives `payload`, optional CAP headers, and optional
  `SubscribeMetadata` containing `messageId` and `dedupeKey`.
- `SubscriberPort.initialize(options?)` and `SubscriberPort.close()` are
  optional.

Topics and groups are logical CAP names. An adapter may add broker resource
prefixes or translate them to a pattern, but those details must not leak into
`cap-core`. Payloads and CAP headers must survive the mapping. When available,
a broker message identifier should become `SubscribeMetadata.messageId`.

`CapEngine` owns durable outbox and inbox state, deduplication, handler retry,
and dead-letter state. It adds the outbox ID as both publish metadata and the
`cap-message-id` header. A transport failure is reported by rejecting `emit`;
the engine records that failure for later outbox retry.

## Inbound Failure and Settlement Boundary

`SubscriberPort` has no acknowledge, reject, complete, abandon, commit, or
retry method. The portable contract therefore makes no broker acknowledgement
guarantee.

An adapter passes a delivery into the registered handler and observes its
result. Successful handler resolution means CAP has persisted and processed the
inbox outcome according to the engine flow. Handler rejection must remain
visible at the adapter boundary. The adapter and broker client own any resulting
settlement, commit, or redelivery behavior.

Do not add acknowledgement semantics to `cap-core` until at least two real
adapters demonstrate a compatible requirement that can be implemented and
tested without weakening either broker's guarantees.

## Current Adapter Behavior

| Behavior         | RabbitMQ                            | Kafka                                       | AWS SNS/SQS                             | Azure Service Bus                | NestJS bridge              |
| ---------------- | ----------------------------------- | ------------------------------------------- | --------------------------------------- | -------------------------------- | -------------------------- |
| Publish success  | Confirm callback plus channel drain | Delivery promise honors configured acks     | SNS Publish resolves                   | `sendMessages()` resolves        | Emit observable resolves   |
| Inbound identity | Broker ID and exchange/group key    | Header ID and topic/group key               | SQS MessageId and topic/group key      | Broker ID and resource/group key | Application metadata       |
| Handler failure  | Manual nack; no requeue by default  | Propagated; offset is not committed         | Not deleted; visibility timeout return | Rethrown to SDK callback         | Rejected from `dispatch()` |
| Recovery         | Bounded adapter reconnect           | Maintained client reconnect/rebalance       | Polling loop retry on error            | Client-owned                     | Transporter-owned          |
| Settlement       | Ack after callback resolves         | Commit `offset + 1` after callback resolves | Delete after callback resolves         | SDK receiver configuration       | Transporter-owned          |

The Nest bridge's emit completion is client-library acceptance, not a portable
durable broker acknowledgement. Azure resource provisioning is adapter-specific
and must not be generalized into core topology guarantees.

## Conformance Suite

Use `defineTransportContract` from `@mikara89/cap-testing` with fast fakes:

```ts
import { defineTransportContract } from '@mikara89/cap-testing';

defineTransportContract(
  'my transport',
  async () => ({
    publisher,
    subscriber,
    harness: {
      publishedMessages: () => observedMessages,
      failNextPublish: (error) => fakeClient.failNext(error),
      deliver: (delivery) => fakeClient.deliver(delivery),
      activeSubscriberResources: () => fakeClient.receiverCount,
    },
    expectedInboundMetadata: {
      messageId: 'inbound-message-id',
      dedupeKey: 'adapter-derived-dedupe-key',
    },
    cleanup: () => fakeClient.close(),
  }),
  {
    supportsPublisherInitialization: false,
    supportsSubscriberInitialization: false,
    supportsPublisherDisposal: false,
    supportsSubscriberDisposal: true,
  },
);
```

The suite covers publish mapping, headers and message identity, publish errors,
inbound registration, delivery metadata, handler failures, repeated supported
lifecycle calls, and resource cleanup. Set every lifecycle capability
explicitly. Unsupported capabilities appear as skipped tests rather than false
passes.

Keep emulator or external integration tests in addition to the fake-backed
contract. The contract proves the CAP boundary; integration tests prove the
real client and broker mapping.

## Capability Discipline

The existing ports do not expose delayed delivery, topology provisioning,
sessions or ordering, broker dead-letter APIs, request/reply, or explicit
acknowledgements. The current adapters also do not establish a shared portable
guarantee for those features. No transport capability interface is added in
this milestone foundation.

Add a core capability only after tests demonstrate real variation that callers
must inspect. Report conservatively: client support or broker documentation is
not an implemented CAP guarantee.

See [Adapters](adapters.md), [Architecture](architecture.md), and the
[Roadmap](roadmap.md).
