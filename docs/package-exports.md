# Package Export Surface

CAP Node.js packages define stable public entry points through package
`exports` maps. Treat those exports as the supported application contract.

Package roots stay framework-neutral unless the package is itself a framework
integration. Optional framework wrappers live behind explicit framework
subpaths, such as `/nest`.

## Stable Root Imports

Use package roots for framework-neutral APIs and for packages whose primary
purpose is a framework integration:

```ts
import { CapEngine } from '@mikara89/cap-core';
import type { CapStorageCapabilities } from '@mikara89/cap-core';
import { CapModule, CapService, CapSubscribe } from '@mikara89/cap-nest';
import { createTestCapEngine } from '@mikara89/cap-testing';
import { createCapExpress } from '@mikara89/cap-express';
import { MikroPublishStorage } from '@mikara89/cap-storage-mikro-orm';
import { ServiceBusPublisher } from '@mikara89/cap-transport-azure-servicebus';
import { NestjsMicroservicesTransportModule } from '@mikara89/cap-transport-nestjs-microservices';
import { CapDashboardModule } from '@mikara89/cap-dashboard-nest';
import { createCapDashboardRouter } from '@mikara89/cap-dashboard-express';
```

The supported package roots are:

- `@mikara89/cap-core`
- `@mikara89/cap-nest`
- `@mikara89/cap-testing`
- `@mikara89/cap-express`
- `@mikara89/cap-storage-mikro-orm`
- `@mikara89/cap-transport-azure-servicebus`
- `@mikara89/cap-transport-nestjs-microservices`
- `@mikara89/cap-dashboard-core`
- `@mikara89/cap-dashboard-nest`
- `@mikara89/cap-dashboard-express`
- `@mikara89/cap-dashboard`

`@mikara89/cap-dashboard` remains supported as a compatibility alias for the
Nest dashboard package root.

Planned packages are not exported until they are implemented and released. Do
not import v2.3 storage package names such as `@mikara89/cap-storage-knex`,
`@mikara89/cap-storage-typeorm`, or `@mikara89/cap-storage-prisma`, and do not
import v2.4 transport package names such as
`@mikara89/cap-transport-rabbitmq`, `@mikara89/cap-transport-kafka`, or
`@mikara89/cap-transport-aws-sns-sqs`, unless those packages exist in the
workspace and are listed here as supported package roots.

## Nest Wrapper Imports

Adapter package roots do not export Nest wrappers. Import Nest integrations
from explicit `/nest` subpaths:

```ts
import { MikroStorageModule } from '@mikara89/cap-storage-mikro-orm/nest';
import { ServiceBusTransportModule } from '@mikara89/cap-transport-azure-servicebus/nest';
```

The supported Nest wrapper subpaths are:

- `@mikara89/cap-storage-mikro-orm/nest`
- `@mikara89/cap-storage-mikro-orm/nest/mikro-storage.module`
- `@mikara89/cap-transport-azure-servicebus/nest`
- `@mikara89/cap-transport-azure-servicebus/nest/servicebus-transport.module`

Nest peer dependencies for adapter packages are required only when using these
`/nest` exports.

## Compatibility Subpaths

The module-specific Nest subpaths are intentional compatibility exports:

- `@mikara89/cap-storage-mikro-orm/nest/mikro-storage.module`
- `@mikara89/cap-transport-azure-servicebus/nest/servicebus-transport.module`

Keep these subpaths stable so existing Nest-facing consumers can migrate away
from package-root wrapper imports without taking another breaking change.

## Unsupported Deep Imports

Imports from package internals are not part of the public API:

```ts
// Avoid: internal path, not covered by compatibility guarantees.
import { CapService } from '@mikara89/cap-nest/dist/cap/cap.service';
```

Do not rely on `dist/*`, source-folder, or other implementation paths in
application code. If an internal symbol is useful to applications, promote it
through a documented package export before recommending it.
