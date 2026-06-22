# @mikara89/cap-dashboard-express

Express router adapter for the framework-agnostic CAP dashboard service.

```ts
import { createCapDashboardRouter } from '@mikara89/cap-dashboard-express';

app.use('/cap', createCapDashboardRouter({ service }));
```
