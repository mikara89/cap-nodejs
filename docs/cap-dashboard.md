# CAP Dashboard

The dashboard package provides an optional admin surface for CAP outbox and
inbox records. It includes REST endpoints and a lightweight static UI.

Package: `@cap/cap-dashboard`

## Current Status

The dashboard exists and is included in the MVP target. It supports listing,
detail views, retry/mark actions, and manual outbox flushing. The UI is still a
small admin surface rather than a polished operations console.

## Registration

Register the dashboard after CAP core storage and transport are available.

```ts
import { Module } from '@nestjs/common';
import { CapModule } from '@cap/cap-nest';
import { CapDashboardModule } from '@cap/cap-dashboard';

@Module({
  imports: [
    CapModule.forInMemory(),
    CapDashboardModule.forRoot({
      guard: {
        provide: 'CAP_DASHBOARD_GUARD',
        useValue: { canActivate: () => true },
      },
      routePrefix: '/api/cap',
      uiRoute: '/cap-dashboard',
      serveStatic: true,
    }),
  ],
})
export class AppModule {}
```

The sample guard is for tests and local demos only. Production apps must provide
a real NestJS guard with authorization appropriate for admin actions.

## Options

- `routePrefix?: string` - REST endpoint base path. Default: `/api/cap`.
- `guard: Provider` - required guard provider for all dashboard routes.
- `pageSizeDefault?: number` - default page size for list responses.
- `serveStatic?: boolean` - serve bundled static UI. Default: `true`.
- `staticAssetsPath?: string` - custom UI assets directory.
- `uiRoute?: string` - static UI route. Default: `/cap-dashboard`.

## REST API

All endpoints are mounted under `routePrefix`.

### Outbox

- `GET /outbox` - list outbox records.
  - Query: `page`, `limit`, `topic`, `onlyUnpublished`, `full`.
- `GET /outbox/:id` - get one outbox record.
  - Query: `full`.
- `POST /outbox/:id/retry` - emit one outbox record and mark it published on
  success.
- `POST /outbox/:id/mark-published` - mark an outbox record as published
  without emitting.

### Inbox

- `GET /inbox` - list inbox records.
  - Query: `page`, `limit`, `topic`, `due`, `full`.
- `GET /inbox/:id` - get one inbox record.
  - Query: `full`.
- `POST /inbox/:id/retry` - re-run the registered handler for one inbox record.
- `POST /inbox/:id/mark-processed` - mark an inbox record as processed.

### Scheduler

- `POST /scheduler/flush-outbox` - planned MVP endpoint for manual outbox flush.
  Publishes currently unpublished outbox records with scheduler-like semantics.

## Response Shapes

List responses:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 50
}
```

Item responses include stable preview fields such as `id`, `topic`,
`retryCount`, status/processed flags, dates, and `payloadPreview`. Full payloads
should only be requested for detail views by passing `full=true`.

## Storage Expectations

The dashboard uses the core storage tokens:

- `PUBLISH_STORAGE`
- `RECEIVED_STORAGE`

For efficient operation, production adapters should provide these optional
methods:

- `findPublishById(id)`
- `findReceivedById(id)`
- `listPublish({ limit, offset, topic })`
- `listReceived({ limit, offset, topic, due })`

Without these methods, the dashboard falls back to less complete or less
efficient behavior. The MikroORM adapter provides these helpers.

## Security Notes

- `guard` is required by `CapDashboardModule.forRoot`.
- Use a production-grade guard before exposing the dashboard.
- Treat retry and mark endpoints as privileged operations.
- Consider separate read-only and operator roles after MVP.
