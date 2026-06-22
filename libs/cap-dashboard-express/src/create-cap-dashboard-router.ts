import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  CapDashboardCoreService,
  type CapDashboardCoreServiceOptions,
  type ListQueryDto,
  type RetryOptions,
} from '@mikara89/cap-dashboard-core';

export interface CreateCapDashboardRouterOptions {
  service?: CapDashboardCoreService;
  serviceOptions?: CapDashboardCoreServiceOptions;
}

export function createCapDashboardRouter(
  options: CreateCapDashboardRouterOptions,
): Router {
  const service =
    options.service ??
    (options.serviceOptions
      ? new CapDashboardCoreService(options.serviceOptions)
      : undefined);

  if (!service) {
    throw new Error(
      'createCapDashboardRouter requires service or serviceOptions',
    );
  }

  const router = Router();

  router.get('/outbox', async (req, res) => {
    await send(res, service.listOutbox(toListQuery(req)));
  });

  router.get('/outbox/:id', async (req, res) => {
    await sendMaybeFound(
      res,
      service.getOutboxById(req.params.id, toBoolean(req.query.full)),
    );
  });

  router.post('/outbox/:id/retry', async (req, res) => {
    await send(res, service.retryOutbox(req.params.id, retryOptions(req)));
  });

  router.post('/outbox/:id/mark-published', async (req, res) => {
    await send(res, service.markOutboxPublished(req.params.id));
  });

  router.get('/inbox', async (req, res) => {
    await send(res, service.listInbox(toListQuery(req)));
  });

  router.get('/inbox/:id', async (req, res) => {
    await sendMaybeFound(
      res,
      service.getInboxById(req.params.id, toBoolean(req.query.full)),
    );
  });

  router.post('/inbox/:id/retry', async (req, res) => {
    await send(res, service.retryInbox(req.params.id, retryOptions(req)));
  });

  router.post('/inbox/:id/mark-processed', async (req, res) => {
    await send(res, service.markInboxProcessed(req.params.id));
  });

  router.post('/scheduler/flush-outbox', async (_req, res) => {
    await send(res, service.flushOutbox());
  });

  return router;
}

async function send<T>(res: Response, result: Promise<T>): Promise<void> {
  res.status(200).json(await result);
}

async function sendMaybeFound<T>(
  res: Response,
  result: Promise<T | undefined>,
): Promise<void> {
  const value = await result;
  if (value === undefined) {
    res.status(404).json({ success: false, message: 'Not found' });
    return;
  }
  res.status(200).json(value);
}

function toListQuery(req: Request): ListQueryDto {
  return {
    page: toOptionalNumber(req.query.page),
    limit: toOptionalNumber(req.query.limit),
    topic: toOptionalString(req.query.topic),
    onlyUnpublished: toOptionalBooleanQuery(req.query.onlyUnpublished),
    due: toOptionalBooleanQuery(req.query.due),
    full: toOptionalBooleanQuery(req.query.full),
  };
}

function retryOptions(req: Request): RetryOptions | undefined {
  if (!req.body || typeof req.body !== 'object') return undefined;
  const body = req.body as { force?: unknown };
  return { force: toBoolean(body.force) };
}

function toOptionalNumber(value: unknown): number | undefined {
  const first = firstQueryValue(value);
  if (first === undefined) return undefined;
  const parsed = Number(first);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  const first = firstQueryValue(value);
  if (first === undefined) return undefined;
  if (typeof first === 'string') return first;
  if (typeof first === 'number' || typeof first === 'boolean') {
    return String(first);
  }
  return undefined;
}

function toOptionalBooleanQuery(value: unknown): boolean | undefined {
  const first = firstQueryValue(value);
  return first === undefined ? undefined : toBoolean(first);
}

function firstQueryValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1' || value === 1;
}
