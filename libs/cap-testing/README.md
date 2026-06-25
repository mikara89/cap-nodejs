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
  },
);
```

Capability options make unsupported behavior explicit in test output instead of
silently skipping important guarantees. Set `supportsTransactions` when the
setup returns a `CapTransactionManagerPort`, set `supportsRollback` when rows
saved inside a rolled-back transaction disappear, and set
`supportsSafeConcurrentClaiming` only for adapters that can safely prevent two
workers from claiming the same outbox row concurrently.

The primary publish storage API is `savePublish(event, ctx?)`. Adapters that
support transactions should read `ctx.tx`. `savePublishWithTx(event, tx)` is
deprecated compatibility only; the contract checks it when an adapter still
implements the method.
