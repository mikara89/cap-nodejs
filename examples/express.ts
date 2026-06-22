import express from 'express';
import { createCapExpress } from '@mikara89/cap-express';
import {
  FakePublisher,
  FakeSubscriber,
  InMemoryPublishStorage,
  InMemoryReceivedStorage,
} from '@mikara89/cap-core';

export function createExpressCapExample() {
  const app = express();
  app.use(express.json());

  const cap = createCapExpress({
    publishStorage: new InMemoryPublishStorage(),
    receivedStorage: new InMemoryReceivedStorage(),
    publisher: new FakePublisher(),
    subscriber: new FakeSubscriber(),
    scheduler: {
      outboxIntervalMs: 5_000,
      inboxRetryIntervalMs: 10_000,
      leaseMs: 30_000,
      maxRetries: 3,
      maxInboxRetries: 3,
    },
  });

  app.use('/health', cap.healthRouter());

  app.post('/users', async (req, res) => {
    await cap.publish('user.created', {
      id: req.body.id as string,
      email: req.body.email as string,
    });

    res.status(202).json({ ok: true });
  });

  return { app, cap };
}
