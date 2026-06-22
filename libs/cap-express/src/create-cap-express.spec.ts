import { createCapExpress } from './create-cap-express';
import {
  FakePublisher,
  FakeSubscriber,
  InMemoryPublishStorage,
  InMemoryReceivedStorage,
} from '@mikara89/cap-core';

describe('createCapExpress', () => {
  it('publishes through the core engine', async () => {
    const publisher = new FakePublisher();
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher,
      subscriber: new FakeSubscriber(),
      idGenerator: () => 'msg-1',
    });

    await cap.publish('user.created', { id: 1 });

    expect(publisher.emitted).toEqual([
      expect.objectContaining({
        topic: 'user.created',
        payload: { id: 1 },
      }),
    ]);
  });

  it('starts and stops the scheduler explicitly', async () => {
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      scheduler: {
        outboxIntervalMs: 10_000,
        inboxRetryIntervalMs: 10_000,
      },
    });

    expect(cap.schedulerRunning).toBe(false);
    await cap.start();
    expect(cap.schedulerRunning).toBe(true);
    await cap.stop();
    expect(cap.schedulerRunning).toBe(false);
  });

  it('creates a health router', () => {
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
    });

    expect(cap.healthRouter()).toBeDefined();
  });
});
