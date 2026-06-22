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
  autoStart: true,
});

app.use('/health', cap.healthRouter());
```
