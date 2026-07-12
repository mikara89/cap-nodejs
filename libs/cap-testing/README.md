# @mikara89/cap-testing

Framework-agnostic testing helpers for CAP.

```ts
import { createTestCapEngine } from '@mikara89/cap-testing';

const cap = createTestCapEngine();

await cap.engine.publish('user.created', { id: 'u1' });
expect(cap.publisher.emitted).toHaveLength(1);
```

## Publish Storage Contract

Adapter authors can use `definePublishStorageContract` to run the shared CAP
outbox behavior suite against a storage adapter:

```ts
import { definePublishStorageContract } from '@mikara89/cap-testing';

definePublishStorageContract(
  'my publish storage',
  async () => {
    const storage = createStorage();

    return {
      storage,
      cleanup: async () => cleanupStorage(),
    };
  },
  {
    supportsTransactions: false,
    supportsRollback: false,
    supportsSafeConcurrentClaiming: false,
    supportsClaimOwnershipFencing: true,
    supportsClaimLeaseRenewal: true,
  },
);
```

Capability options make unsupported behavior explicit in test output instead of
silently skipping important guarantees. Set `supportsTransactions` when the
setup returns a `CapTransactionManagerPort`, set `supportsRollback` when rows
saved inside a rolled-back transaction disappear, and set
`supportsSafeConcurrentClaiming` only for adapters that can safely prevent two
workers from claiming the same outbox row concurrently.

Set `supportsClaimOwnershipFencing` when stale success and failure writes are
rejected by an atomic owner predicate. Set `supportsClaimLeaseRenewal` when a
matching, unexpired claim can be extended and release at the old expiry cannot
overwrite that renewal. The contract also verifies reclaim-to-new-owner races.

The primary publish storage API is `savePublish(event, ctx?)`. Adapters that
support transactions should read `ctx.tx`. `savePublishWithTx(event, tx)` is
deprecated compatibility only; the contract checks it when an adapter still
implements the method.

Adapters can also implement `CapabilityAwareStoragePort` from `cap-core` to
report informational storage behavior. Keep contract capability flags explicit
even when `getCapabilities()` is implemented, so unsupported behavior remains
clear in test output.

## Received Storage Contract

Adapter authors can use `defineReceivedStorageContract` to run the shared CAP
inbox behavior suite against a storage adapter:

```ts
import { defineReceivedStorageContract } from '@mikara89/cap-testing';

defineReceivedStorageContract(
  'my received storage',
  async () => {
    const storage = createStorage();

    return {
      storage,
      cleanup: async () => cleanupStorage(),
    };
  },
  {
    supportsAtomicInsertIgnore: false,
    supportsSafeConcurrentInsert: false,
  },
);
```

The received contract verifies insert, `group + dedupeKey` idempotency,
processed state, retry/dead-letter state, and due retry reads. Concurrency
capability options make unsupported guarantees visible as skipped tests.

Use this together with the
[storage adapter author guide](../../docs/storage-adapter-author-guide.md).

## Transport Contract

Adapter authors can use `defineTransportContract` to qualify publisher and
subscriber implementations with fast client fakes. The suite verifies logical
topic and payload mapping (including business objects with a `payload` field),
raw versioned-envelope body round-trips, headers, message identity, publish
errors, inbound handler registration, delivery metadata, handler failure
propagation, repeated supported lifecycle calls, and cleanup.

The setup supplies an adapter-neutral harness that observes published messages,
injects a publish failure, and delivers an inbound fixture. Lifecycle
capabilities are required and explicit:

```ts
defineTransportContract('my transport', setup, {
  supportsPublisherInitialization: false,
  supportsSubscriberInitialization: false,
  supportsPublisherDisposal: false,
  supportsSubscriberDisposal: true,
});
```

Unsupported lifecycle behavior is reported as skipped tests. The suite does
not invent broker acknowledgement semantics: the current public subscriber
port exposes only handler resolution or rejection. Settlement and broker
redelivery remain adapter/client responsibilities.

Use this together with the
[transport adapter author guide](../../docs/transport-adapter-author-guide.md).
