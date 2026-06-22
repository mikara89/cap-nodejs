# @mikara89/cap-core

Framework-agnostic CAP engine, models, ports, utilities, scheduler, and
in-memory testing adapters.

Use this package directly when building non-Nest adapters, workers, tests, or
custom framework integrations.

```ts
import { CapEngine } from '@mikara89/cap-core';

const engine = new CapEngine({
  publishStorage,
  receivedStorage,
  publisher,
  subscriber,
});
```

NestJS users can continue importing compatible CAP types through
`@mikara89/cap-nest`.
