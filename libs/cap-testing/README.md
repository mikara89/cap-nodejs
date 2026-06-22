# @mikara89/cap-testing

Framework-agnostic testing helpers for CAP.

```ts
import { createTestCapEngine } from '@mikara89/cap-testing';

const cap = createTestCapEngine();

await cap.engine.publish('user.created', { id: 'u1' });
expect(cap.publisher.emitted).toHaveLength(1);
```
