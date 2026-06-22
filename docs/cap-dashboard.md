# CAP Dashboard

The dashboard package provides an optional admin surface for CAP outbox and
inbox records. It includes REST endpoints and a lightweight static UI.

Package: `@mikara89/cap-dashboard-nest`

## Current Status

The dashboard exists and is included in the MVP target. It supports listing,
detail views, retry/mark actions, and manual outbox flushing. The UI is still a
small admin surface rather than a polished operations console.

## Registration

Register the dashboard after CAP core storage and transport are available.

```ts
import { Module } from '@nestjs/common';
import { CapModule } from '@mikara89/cap-nest';
import { CapDashboardModule } from '@mikara89/cap-dashboard-nest';

@Module({
  imports: [
    CapModule.forInMemory(),
    CapDashboardModule.forRoot({
      guard: {
        provide: 'CAP_DASHBOARD_GUARD',
        useValue: { canActivate: () => true },
      },
      authorizer: {
        provide: 'CAP_DASHBOARD_AUTHORIZER',
        useValue: ({ permission }) => permission === 'read',
      },
      routePrefix: '/api/cap',
      uiRoute: '/cap-dashboard',
      serveStatic: true,
    }),
  ],
})
export class AppModule {}
```

The sample guard and authorizer are for tests and local demos only. Production
apps must provide real NestJS authentication and authorization appropriate for
admin actions.

MVP must keep dashboard security application-owned. CAP should not prescribe a
specific identity provider, session model, token format, or role system. The
host application can pass a NestJS guard for authentication and an optional
operation-aware authorizer for read/admin policy.

## Options

- `routePrefix?: string` - REST endpoint base path. Default: `/api/cap`.
- `guard: Provider` - required guard provider for all dashboard routes.
- `authorizer?: Provider` - optional operation-aware read/admin policy hook.
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

- `POST /scheduler/flush-outbox` - manual outbox flush.
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
and headers should only be requested for detail views by passing `full=true`.

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
- The bundled dashboard UI is served through guarded CAP routes.
- Use a production-grade guard before exposing the dashboard. The guard should
  authenticate the incoming request and authorize access according to the host
  application's policy.
- The optional authorizer receives `{ action, permission, request,
  executionContext }`. Read routes use `permission: 'read'`; retry, mark, and
  flush routes use `permission: 'admin'`.
- Treat retry and mark endpoints as privileged operations.
