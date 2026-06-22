import { Router } from 'express';
import type { CapExpressApp } from './create-cap-express';

export function createCapHealthRouter(cap: CapExpressApp): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  router.get('/health/cap', (_req, res) => {
    res.status(200).json({
      ok: true,
      schedulerRunning: cap.schedulerRunning,
    });
  });

  return router;
}
