import { CapScheduler } from './cap-scheduler';
import { type CapEngine } from './cap-engine';

describe('CapScheduler', () => {
  let engine: Pick<CapEngine, 'dispatchOutboxBatch' | 'retryInboxBatch'>;

  beforeEach(() => {
    engine = {
      dispatchOutboxBatch: jest.fn().mockResolvedValue(1),
      retryInboxBatch: jest.fn().mockResolvedValue(2),
    };
  });

  it('runs outbox and inbox once through the engine', async () => {
    const scheduler = new CapScheduler(engine as CapEngine, {
      outboxIntervalMs: 1000,
      inboxRetryIntervalMs: 1000,
    });

    await expect(scheduler.runOutboxOnce()).resolves.toBe(1);
    await expect(scheduler.runInboxRetryOnce()).resolves.toBe(2);

    expect(engine.dispatchOutboxBatch).toHaveBeenCalledTimes(1);
    expect(engine.retryInboxBatch).toHaveBeenCalledTimes(1);
  });

  it('does not overlap outbox runs', async () => {
    let release!: () => void;
    const pending = new Promise<number>((resolve) => {
      release = () => resolve(3);
    });
    engine.dispatchOutboxBatch = jest.fn().mockReturnValue(pending);
    const scheduler = new CapScheduler(engine as CapEngine, {
      outboxIntervalMs: 1000,
      inboxRetryIntervalMs: 1000,
    });

    const first = scheduler.runOutboxOnce();
    const second = scheduler.runOutboxOnce();
    release();

    await expect(Promise.all([first, second])).resolves.toEqual([3, 3]);
    expect(engine.dispatchOutboxBatch).toHaveBeenCalledTimes(1);
  });

  it('stop waits for in-flight runs', async () => {
    let release!: () => void;
    const pending = new Promise<number>((resolve) => {
      release = () => resolve(4);
    });
    engine.retryInboxBatch = jest.fn().mockReturnValue(pending);
    const scheduler = new CapScheduler(engine as CapEngine, {
      outboxIntervalMs: 1000,
      inboxRetryIntervalMs: 1000,
    });

    const run = scheduler.runInboxRetryOnce();
    const stopped = scheduler.stop();
    release();

    await expect(run).resolves.toBe(4);
    await expect(stopped).resolves.toBeUndefined();
  });
});
