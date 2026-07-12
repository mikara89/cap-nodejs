# @mikara89/cap-express

Express adapter for the framework-agnostic CAP engine.

This package provides explicit lifecycle helpers around `CapEngine`:

- `createCapExpress`
- `createCapHealthRouter`

## Usage Shape

```ts
import express from 'express';
import { createCapExpress } from '@mikara89/cap-express';

const app = express();
const cap = createCapExpress({
  publishStorage,
  receivedStorage,
  publisher,
  subscriber,
});

await cap.subscribe('user.created', 'mail-service', async (payload) => {
  await sendWelcomeEmail(payload);
});

await cap.start();
app.use('/health', cap.healthRouter());

// During graceful application shutdown:
await cap.stop();
```

Before `start()`, `subscribe()` only registers a handler and performs no broker
I/O. `start()` initializes configured adapters, awaits initial consumer
attachment, and then starts the retry scheduler. It rejects if initialization
or attachment fails. Concurrent starts share the same startup operation.

`cap.ready` is the stable readiness promise for the current lifecycle cycle, so
it may safely be captured before calling `start()`. It resolves or rejects with
that cycle's startup attempt. A failed-start retry and a completed `stop()` each
create the readiness promise for a new cycle.

`stop()` stops the scheduler and closes consumers. Concurrent stops share one
shutdown operation. A `start()` requested while shutdown is active waits for it
and then performs a fresh startup, leaving the final state ready.

Set `autoStart: true` when startup cannot be explicitly coordinated. In that
mode, await `cap.ready` before accepting traffic so initialization and consumer
attachment failures remain visible:

```ts
const cap = createCapExpress({
  publishStorage,
  receivedStorage,
  publisher,
  subscriber,
  autoStart: true,
});

await cap.ready;
```
