import { createCapExpress } from './create-cap-express';
import {
  CapScheduler,
  FakePublisher,
  FakeSubscriber,
  InMemoryPublishStorage,
  InMemoryReceivedStorage,
  type CapOperationContext,
  type CapTransactionManagerPort,
  type CapTransactionOptions,
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
      'CAP Express start failed',
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
      'CAP Express start failed',
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

  it('exposes transaction through the core engine', async () => {
    const transactionManager = new FakeTransactionManager({ tx: 'express-tx' });
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      transactionManager,
    });
    const options = { readOnly: true };

    await expect(
      cap.transaction(async (ctx) => {
        await Promise.resolve();
        expect(ctx.tx).toBe('express-tx');
        return 'ok';
      }, options),
    ).resolves.toBe('ok');

    expect(transactionManager.runInTransactionCalls).toEqual([options]);
  });

  // -----------------------------------------------------------------------
  // Ready promise behaviour
  // -----------------------------------------------------------------------

  it('ready does not resolve before manual start', async () => {
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
    });

    let resolved = false;
    void cap.ready.then(() => {
      resolved = true;
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(resolved).toBe(false);
    expect(cap.schedulerRunning).toBe(false);
  });

  it('ready resolves after manual start', async () => {
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
    });

    const startPromise = cap.start();
    await expect(cap.ready).resolves.toBeUndefined();
    await startPromise;
    expect(cap.schedulerRunning).toBe(true);

    await cap.stop();
  });

  it('settles a ready promise captured before manual start', async () => {
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
    });

    const readiness = cap.ready;
    const startup = cap.start();

    await startup;
    await expect(readiness).resolves.toBeUndefined();

    await cap.stop();
  });

  it('ready rejects on start failure and resolves on retry', async () => {
    // Use a subscriber whose consume fails on the first attempt.
    const subscriber = new FakeSubscriber();
    const failError = new Error('first start failed');
    let firstCall = true;
    const origConsume = subscriber.consume.bind(subscriber);
    subscriber.consume = (
      topic: string,
      group: string,

      _handler: any,
    ): Promise<void> => {
      if (firstCall) {
        firstCall = false;
        return Promise.reject(failError);
      }
      return origConsume(topic, group, _handler);
    };

    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber,
    });

    void cap.subscribe('t', 'g', jest.fn());

    // First start fails — both start() and ready reject.
    await expect(cap.start()).rejects.toThrow('first start failed');
    await expect(cap.ready).rejects.toThrow('first start failed');

    // Retry succeeds — both start() and ready resolve.
    await cap.start();
    await expect(cap.ready).resolves.toBeUndefined();

    await cap.stop();
  });

  it('ready resets after stop and resolves on restart', async () => {
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
    });

    await cap.start();
    await cap.stop();

    // After stop, ready should be pending again.
    let resolved = false;
    void cap.ready.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(resolved).toBe(false);

    // Restart resolves ready.
    await cap.start();
    await expect(cap.ready).resolves.toBeUndefined();

    await cap.stop();
  });

  it('concurrent start calls both resolve together', async () => {
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
    });

    const p1 = cap.start();
    const p2 = cap.start();

    await Promise.all([p1, p2]);
    await expect(cap.ready).resolves.toBeUndefined();
    expect(cap.schedulerRunning).toBe(true);

    await cap.stop();
  });

  it('concurrent start calls initialize adapters exactly once', async () => {
    const publishStorage = withInitializer(new InMemoryPublishStorage());
    const cap = createCapExpress({
      publishStorage,
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      init: { autoInit: true },
    });

    await Promise.all([cap.start(), cap.start()]);

    expect(publishStorage.initialize).toHaveBeenCalledTimes(1);

    await cap.stop();
  });

  it('restarts after stop requested during pending start', async () => {
    const firstInitialization = deferred<void>();
    let initializationCount = 0;
    const publishStorage = withInitializer(new InMemoryPublishStorage(), () => {
      initializationCount += 1;
      return initializationCount === 1
        ? firstInitialization.promise
        : Promise.resolve();
    });
    const subscriber = new ClosableFakeSubscriber();
    const cap = createCapExpress({
      publishStorage,
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber,
      init: { autoInit: true },
    });

    const initialStart = cap.start();
    await waitFor(() => initializationCount === 1);
    const stop = cap.stop();
    const restart = cap.start();

    firstInitialization.resolve();
    await Promise.all([initialStart, stop, restart]);

    expect(cap.schedulerRunning).toBe(true);
    expect(publishStorage.initialize).toHaveBeenCalledTimes(2);
    expect(subscriber.close).toHaveBeenCalledTimes(1);

    await cap.stop();
  });

  it('restarts after stop requested from the started state', async () => {
    const closeBlocker = deferred<void>();
    const closeStarted = deferred<void>();
    let closeCount = 0;
    const subscriber = new ClosableFakeSubscriber(async () => {
      closeCount += 1;
      if (closeCount === 1) {
        closeStarted.resolve();
        await closeBlocker.promise;
      }
    });
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber,
    });

    await cap.start();
    const stop = cap.stop();
    await closeStarted.promise;
    const restart = cap.start();

    closeBlocker.resolve();
    await Promise.all([stop, restart]);

    expect(cap.schedulerRunning).toBe(true);
    expect(subscriber.close).toHaveBeenCalledTimes(1);

    await cap.stop();
  });

  it('deduplicates concurrent stops', async () => {
    const closeBlocker = deferred<void>();
    const closeStarted = deferred<void>();
    const subscriber = new ClosableFakeSubscriber(async () => {
      closeStarted.resolve();
      await closeBlocker.promise;
    });
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber,
    });

    await cap.start();
    const firstStop = cap.stop();
    await closeStarted.promise;
    const secondStop = cap.stop();

    closeBlocker.resolve();
    await Promise.all([firstStop, secondStop]);

    expect(cap.schedulerRunning).toBe(false);
    expect(subscriber.close).toHaveBeenCalledTimes(1);
  });

  it('requires a successful stop retry before restarting after close fails', async () => {
    const closeError = new Error('close failed');
    let closeAttempt = 0;
    const subscriber = new ClosableFakeSubscriber(() => {
      closeAttempt += 1;
      return closeAttempt === 1
        ? Promise.reject(closeError)
        : Promise.resolve();
    });
    const consumeSpy = jest.spyOn(subscriber, 'consume');
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber,
    });

    await cap.subscribe('t', 'g', jest.fn());
    await cap.start();

    await expect(cap.stop()).rejects.toThrow('close failed');

    expect(cap.schedulerRunning).toBe(false);
    expect(cap.subscriptionLifecycle()).toEqual({
      state: 'failed',
      registeredCount: 1,
      attachedCount: 1,
      failure: { message: 'close failed' },
    });
    await expect(cap.ready).rejects.toThrow('close failed');
    await expect(cap.start()).rejects.toThrow(
      'subscription shutdown is incomplete',
    );
    expect(cap.schedulerRunning).toBe(false);
    expect(consumeSpy).toHaveBeenCalledTimes(1);

    await expect(cap.stop()).resolves.toBeUndefined();
    await expect(cap.start()).resolves.toBeUndefined();

    expect(cap.schedulerRunning).toBe(true);
    expect(cap.subscriptionLifecycle().state).toBe('ready');
    expect(consumeSpy).toHaveBeenCalledTimes(2);
    expect(subscriber.close).toHaveBeenCalledTimes(2);
    await expect(cap.ready).resolves.toBeUndefined();

    await cap.stop();
  });

  it('start() rejects when adapter initialization fails', async () => {
    const error = new Error('adapter init failed');
    const publishStorage = withInitializer(new InMemoryPublishStorage(), () =>
      Promise.reject(error),
    );
    const cap = createCapExpress({
      publishStorage,
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      init: { autoInit: true },
    });

    await expect(cap.start()).rejects.toThrow('adapter init failed');
    await expect(cap.ready).rejects.toThrow('adapter init failed');
    expect(cap.schedulerRunning).toBe(false);
  });

  it('ready reflects current start outcome', async () => {
    const cap = createCapExpress({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
    });

    // Before start, ready is pending.
    let resolved = false;
    void cap.ready.then(() => {
      resolved = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(resolved).toBe(false);

    // After start, the current ready resolves.
    await cap.start();
    await expect(cap.ready).resolves.toBeUndefined();

    await cap.stop();
  });

  it('ready reflects current failure', async () => {
    const error = new Error('init failed');
    const publishStorage = withInitializer(new InMemoryPublishStorage(), () =>
      Promise.reject(error),
    );
    const cap = createCapExpress({
      publishStorage,
      receivedStorage: new InMemoryReceivedStorage(),
      publisher: new FakePublisher(),
      subscriber: new FakeSubscriber(),
      init: { autoInit: true },
    });

    // start() rejects and ready rejects with the same error.
    await expect(cap.start()).rejects.toThrow('init failed');
    await expect(cap.ready).rejects.toThrow('init failed');
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
  constructor(onClose: () => Promise<void> = () => Promise.resolve()) {
    super();
    this.close = jest.fn(onClose);
  }

  close: jest.Mock<Promise<void>, []>;
}

class FakeTransactionManager implements CapTransactionManagerPort {
  readonly runInTransactionCalls: CapTransactionOptions[] = [];

  constructor(private readonly ctx: { tx: unknown }) {}

  runInTransaction<T>(
    options: CapTransactionOptions,
    fn: (ctx: CapOperationContext) => Promise<T>,
  ): Promise<T> {
    this.runInTransactionCalls.push(options);
    return fn(this.ctx);
  }
}

async function waitFor(assertion: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (assertion()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('Timed out waiting for condition');
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve(value?: T): void;
  reject(error: unknown): void;
} {
  let resolvePromise!: (value: T | PromiseLike<T>) => void;
  let rejectPromise!: (error: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: (value?: T) => resolvePromise(value as T),
    reject: rejectPromise,
  };
}
