# Package Export Surface

CAP packages currently use classic CommonJS package metadata with `main` and
`types`. This document records the intended public import surface before adding
package `exports` maps.

## Supported Public Imports

Use package-root imports:

```ts
import { CapModule, CapService, CapSubscribe } from '@mikara89/cap-nest';
import { MikroStorageModule } from '@mikara89/mikroorm-storage';
import { ServiceBusTransportModule } from '@mikara89/azure-servicebus-transport';
import { NestjsMicroservicesTransportModule } from '@mikara89/nestjs-microservices-transport';
import { CapDashboardModule } from '@mikara89/cap-dashboard';
```

The supported package roots are:

- `@mikara89/cap-nest`
- `@mikara89/mikroorm-storage`
- `@mikara89/azure-servicebus-transport`
- `@mikara89/nestjs-microservices-transport`
- `@mikara89/cap-dashboard`

## Unsupported Deep Imports

Imports from package internals are not part of the public API:

```ts
// Avoid: internal path, not covered by compatibility guarantees.
import { CapService } from '@mikara89/cap-nest/dist/cap/cap.service';
```

Internal folder layout can change during beta without a compatibility guarantee.
If an internal symbol is useful to applications, promote it through the package
root before documenting it.

## Follow-Up Decision

Do not add package `exports` maps in this pass. Add them after at least one beta
cycle or after confirming examples, docs, tests, and known consumers do not rely
on deep imports.

The likely future shape is:

- root `.` export for every package;
- optional `./testing` export for `@mikara89/cap-nest` only if testing helpers are
  intentionally supported for consumers.
