# @mikara89/cap-dashboard-nest

Optional dashboard package for CAP outbox and inbox operations.

This package provides:

- `CapDashboardModule`
- REST endpoints for outbox and inbox inspection
- manual retry and mark actions
- a lightweight static UI
- required guard integration for dashboard access

## Usage Shape

```ts
import { CapDashboardModule } from '@mikara89/cap-dashboard-nest';

CapDashboardModule.forRoot({
  guard: {
    provide: 'CAP_DASHBOARD_GUARD',
    useValue: { canActivate: () => true },
  },
  routePrefix: '/api/cap',
  uiRoute: '/cap-dashboard',
});
```

Replace the sample guard with a real authorization guard before exposing the
dashboard.

`@mikara89/cap-dashboard` remains available as a compatibility alias.

## Documentation

- [Dashboard guide](../../docs/cap-dashboard.md)
- [API reference](../../docs/api/README.md)
- [Package export surface](../../docs/package-exports.md)
- [Repository overview](../../README.md)
- [Architecture](../../docs/architecture.md)
- [Roadmap](../../docs/roadmap.md)
- [ADRs](../../docs/adr/README.md)
