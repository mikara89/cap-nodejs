import { createCapExpress } from './create-cap-express';
import {
  CapScheduler,
  FakePublisher,
  FakeSubscriber,
  InMemoryPublishStorage,
  InMemoryReceivedStorage,
  type InitOptions,
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

  it('initializes adapters with configured init options before scheduler start', async () => {
    const init: InitOptions = { createSchema: true, createQueues: true };
    const calls: string[] = [];
    let releasePublishInit!: () => void;
    const publishInitBlocker = new Promise<void>((resolve) => {
      releasePublishInit = resolve;
    });
    const publishStorage = withInitializer(new InMemoryPublishStorage(), () => {
      calls.push('publishStorage');
      return publishInitBlocker;
    });
    const receivedStorage = withInitializer(
      new InMemoryReceivedStorage(),
      () => {
        calls.push('receivedStorage');
      },
    );
    const publisher = withInitializer(new FakePublisher(), () => {
      calls.push('publisher');
    });
    const subscriber = withInitializer(new FakeSubscriber(), () => {
      calls.push('subscriber');
    });
    const cap = createCapExpress({
      publishStorage,
      receivedStorage,
      publisher,
      subscriber,
      init,
    });

    const startPromise = cap.start();
    await waitFor(() => calls.includes('publishStorage'));

    expect(cap.schedulerRunning).toBe(false);

    releasePublishInit();
    await startPromise;

    expect(calls).toEqual([
      'publishStorage',
      'receivedStorage',
      'publisher',
      'subscriber',
    ]);
    expect(publishStorage.initialize).toHaveBeenCalledWith(init);
    expect(receivedStorage.initialize).toHaveBeenCalledWith(init);
    expect(publisher.initialize).toHaveBeenCalledWith(init);
    expect(subscriber.initialize).toHaveBeenCalledWith(init);
    expect(cap.schedulerRunning).toBe(true);

    await cap.stop();
  });

  it('does not initialize adapters twice when start is called repeatedly', async () => {
    const publishStorage = withInitializer(new InMemoryPublishStorage());
    const cap = createCapExpress({
      publishStorage,
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      init: { autoInit: true },
    });

    await cap.start();
    await cap.start();

    expect(publishStorage.initialize).toHaveBeenCalledTimes(1);

    await cap.stop();
  });

  it('initializes adapters when autoStart is enabled', async () => {
    const publishStorage = withInitializer(new InMemoryPublishStorage());
    const cap = createCapExpress({
      publishStorage,
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      init: { autoInit: true },
      autoStart: true,
    });

    await expect(cap.ready).resolves.toBeUndefined();
    await waitFor(() => cap.schedulerRunning);

    expect(publishStorage.initialize).toHaveBeenCalledWith({ autoInit: true });

    await cap.stop();
  });

  it('surfaces adapter initialization failures during autoStart', async () => {
    const error = new Error('init failed');
    const logger = { error: jest.fn() };
    const publishStorage = withInitializer(new InMemoryPublishStorage(), () =>
      Promise.reject(error),
    );
    const cap = createCapExpress({
      publishStorage,
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      init: { autoInit: true },
      autoStart: true,
      logger,
    });

    await expect(cap.ready).rejects.toThrow('init failed');
    expect(logger.error).toHaveBeenCalledWith(
      'CAP Express autoStart failed',
      error,
    );
    expect(cap.schedulerRunning).toBe(false);
  });

  it('surfaces scheduler start failures during autoStart', async () => {
    const error = new Error('scheduler failed');
    const logger = { error: jest.fn() };
    const startSpy = jest
      .spyOn(CapScheduler.prototype, 'start')
      .mockImplementationOnce(() => {
        throw error;
      });
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      autoStart: true,
      logger,
    });

    await expect(cap.ready).rejects.toThrow('scheduler failed');
    expect(logger.error).toHaveBeenCalledWith(
      'CAP Express autoStart failed',
      error,
    );
    expect(cap.schedulerRunning).toBe(false);

    startSpy.mockRestore();
  });

  it('stops the scheduler and closes the subscriber', async () => {
    const subscriber = new ClosableFakeSubscriber();
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber,
    });

    await cap.start();
    await cap.stop();

    expect(cap.schedulerRunning).toBe(false);
    expect(subscriber.close).toHaveBeenCalledTimes(1);
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

function withInitializer<T extends object>(
  adapter: T,
  onInitialize?: () => void | Promise<void>,
): T & { initialize: jest.Mock<Promise<void>, [InitOptions?]> } {
  return Object.assign(adapter, {
    initialize: jest.fn((_options?: InitOptions) => {
      const result = onInitialize?.();
      return result
        ? Promise.resolve(result).then(() => undefined)
        : Promise.resolve();
    }),
  });
}

class ClosableFakeSubscriber extends FakeSubscriber {
  close = jest.fn(() => Promise.resolve());
}

async function waitFor(assertion: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (assertion()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Timed out waiting for condition');
}
