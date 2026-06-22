# @mikara89/cap-dashboard

Compatibility alias for the Nest dashboard package.

Prefer new imports from `@mikara89/cap-dashboard-nest`:

```ts
import { CapDashboardModule } from '@mikara89/cap-dashboard-nest';
```

Existing package-root imports continue to work:

```ts
import { CapDashboardModule } from '@mikara89/cap-dashboard';
```

The implementation, REST endpoints, static UI, and guard integration live in
`@mikara89/cap-dashboard-nest`.

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

## Documentation

- [Dashboard guide](../../docs/cap-dashboard.md)
- [API reference](../../docs/api/README.md)
- [Package export surface](../../docs/package-exports.md)
- [Repository overview](../../README.md)
- [Architecture](../../docs/architecture.md)
- [Roadmap](../../docs/roadmap.md)
- [ADRs](../../docs/adr/README.md)
