import { runWithActiveLeaseHeartbeat } from './active-lease-heartbeat.util';

describe('runWithActiveLeaseHeartbeat', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renews without overlap and stops after operation success', async () => {
    const operation = deferred<void>();
    const firstRenewal = deferred<boolean>();
    const renew = jest
      .fn<Promise<boolean>, []>()
      .mockReturnValueOnce(firstRenewal.promise)
      .mockResolvedValue(true);
    const running = runWithActiveLeaseHeartbeat(() => operation.promise, {
      cadenceMs: 10,
      renew,
    });

    await jest.advanceTimersByTimeAsync(20);
    expect(renew).toHaveBeenCalledTimes(1);

    firstRenewal.resolve(true);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(10);
    expect(renew).toHaveBeenCalledTimes(2);

    operation.resolve();
    await expect(running).resolves.toEqual({
      status: 'fulfilled',
      value: undefined,
      ownershipLost: false,
    });
    await jest.advanceTimersByTimeAsync(100);
    expect(renew).toHaveBeenCalledTimes(2);
  });

  it('records lost ownership while allowing the operation to settle', async () => {
    const operation = deferred<string>();
    const running = runWithActiveLeaseHeartbeat(() => operation.promise, {
      cadenceMs: 10,
      renew: () => Promise.resolve(false),
    });

    await jest.advanceTimersByTimeAsync(10);
    operation.resolve('published');

    await expect(running).resolves.toEqual({
      status: 'fulfilled',
      value: 'published',
      ownershipLost: true,
    });
  });

  it('reports renewal errors and treats ownership as lost', async () => {
    const operation = deferred<void>();
    const renewalError = new Error('renewal failed');
    const onRenewalError = jest.fn();
    const running = runWithActiveLeaseHeartbeat(() => operation.promise, {
      cadenceMs: 10,
      renew: () => Promise.reject(renewalError),
      onRenewalError,
    });

    await jest.advanceTimersByTimeAsync(10);
    operation.resolve();

    await expect(running).resolves.toMatchObject({
      status: 'fulfilled',
      ownershipLost: true,
    });
    expect(onRenewalError).toHaveBeenCalledWith(renewalError);
  });

  it('returns operation failures without leaking a timer', async () => {
    const operationError = new Error('emit failed');
    const renew = jest.fn().mockResolvedValue(true);

    await expect(
      runWithActiveLeaseHeartbeat(() => Promise.reject(operationError), {
        cadenceMs: 10,
        renew,
      }),
    ).resolves.toEqual({
      status: 'rejected',
      reason: operationError,
      ownershipLost: false,
    });
    await jest.advanceTimersByTimeAsync(100);
    expect(renew).not.toHaveBeenCalled();
  });
});

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value?: T) => void;
} {
  let resolveDeferred!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return {
    promise,
    resolve: (value?: T) => resolveDeferred(value as T),
  };
}
