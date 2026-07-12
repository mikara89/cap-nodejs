import { Router } from 'express';
import type { CapExpressApp } from './create-cap-express';

export function createCapHealthRouter(cap: CapExpressApp): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  router.get('/health/cap', (_req, res) => {
    const lifecycle = cap.subscriptionLifecycle();
    const ready = lifecycle.state === 'ready';

    const body: Record<string, unknown> = {
      ok: ready,
      schedulerRunning: cap.schedulerRunning,
      subscriptions: {
        state: lifecycle.state,
        registeredCount: lifecycle.registeredCount,
        attachedCount: lifecycle.attachedCount,
      },
    };

    if (lifecycle.failure) {
      (body.subscriptions as Record<string, unknown>).failure = {
        topic: lifecycle.failure.topic,
        group: lifecycle.failure.group,
        message: lifecycle.failure.message,
      };
    }

    res.status(ready ? 200 : 503).json(body);
  });

  return router;
}
