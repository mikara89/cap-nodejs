import { runWithActiveLeaseHeartbeat } from './active-lease-heartbeat';

describe('runWithActiveLeaseHeartbeat (dashboard-internal)', () => {
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

  it('does not schedule further renewals after ownership loss', async () => {
    const operation = deferred<void>();
    const renew = jest
      .fn<Promise<boolean>, []>()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const running = runWithActiveLeaseHeartbeat(() => operation.promise, {
      cadenceMs: 10,
      renew,
    });

    await jest.advanceTimersByTimeAsync(10);
    expect(renew).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(10);
    expect(renew).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(100);
    expect(renew).toHaveBeenCalledTimes(2);

    operation.resolve();
    await running;
    await jest.advanceTimersByTimeAsync(100);
    expect(renew).toHaveBeenCalledTimes(2);
  });

  it('awaits in-flight renewal during cleanup after success', async () => {
    const operation = deferred<void>();
    const inFlightRenewal = deferred<boolean>();
    let finallyRan = false;
    const renew = jest
      .fn<Promise<boolean>, []>()
      .mockResolvedValueOnce(true)
      .mockReturnValueOnce(
        inFlightRenewal.promise.then((v) => {
          finallyRan = true;
          return v;
        }),
      );
    const running = runWithActiveLeaseHeartbeat(() => operation.promise, {
      cadenceMs: 10,
      renew,
    });

    // Let the first renewal fire and finish, then the second fire and stay pending
    await jest.advanceTimersByTimeAsync(10);
    await jest.advanceTimersByTimeAsync(10);
    expect(renew).toHaveBeenCalledTimes(2);

    // Resolve the operation – the heartbeat enters its finally block and
    // awaits the in-flight renewal chain.
    operation.resolve();

    // At this point the heartbeat is suspended on the pending renewal.
    // Resolve it so the heartbeat can complete.
    inFlightRenewal.resolve(true);

    const result = await running;
    expect(finallyRan).toBe(true);
    expect(result).toEqual({
      status: 'fulfilled',
      value: undefined,
      ownershipLost: false,
    });
  });

  it('awaits in-flight renewal during cleanup after failure', async () => {
    const operationError = new Error('emit failed');
    const operation = deferred<void>();
    const inFlightRenewal = deferred<boolean>();
    let finallyRan = false;
    let callCount = 0;
    const renew = jest.fn<Promise<boolean>, []>().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(true);
      return inFlightRenewal.promise.then((v) => {
        finallyRan = true;
        return v;
      });
    });
    const running = runWithActiveLeaseHeartbeat(() => operation.promise, {
      cadenceMs: 10,
      renew,
    });

    // Let the first renewal fire and finish, then the second fire and stay pending
    await jest.advanceTimersByTimeAsync(10);
    await jest.advanceTimersByTimeAsync(10);
    expect(renew).toHaveBeenCalledTimes(2);

    // Reject the operation
    operation.reject(operationError);

    // Resolve the in-flight renewal – the heartbeat should complete afterwards
    inFlightRenewal.resolve(true);

    const result = await running;
    expect(finallyRan).toBe(true);
    expect(result).toEqual({
      status: 'rejected',
      reason: operationError,
      ownershipLost: false,
    });
  });

  it('preserves rejection after ownership is lost', async () => {
    const operationError = new Error('broker error');
    const operation = deferred<void>();
    const running = runWithActiveLeaseHeartbeat(() => operation.promise, {
      cadenceMs: 10,
      renew: () => Promise.resolve(false),
    });

    // Fire the renewal which returns false (ownership lost)
    await jest.advanceTimersByTimeAsync(10);

    // Now reject the operation – ownership was already lost
    operation.reject(operationError);
    await Promise.resolve();

    await expect(running).resolves.toEqual({
      status: 'rejected',
      reason: operationError,
      ownershipLost: true,
    });
  });

  it('does not produce unhandled promise rejections', async () => {
    const rejectionHandler = jest.fn();
    const unhandledListener = (event: NodeJS.UnhandledRejectionListener) => {
      rejectionHandler(event);
    };
    process.on('unhandledRejection', unhandledListener);

    try {
      const operation = deferred<void>();
      const running = runWithActiveLeaseHeartbeat(() => operation.promise, {
        cadenceMs: 10,
        renew: () => Promise.reject(new Error('renewal error')),
      });

      await jest.advanceTimersByTimeAsync(10);
      operation.resolve();
      await running;
      await jest.advanceTimersByTimeAsync(100);

      expect(rejectionHandler).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandledListener);
    }
  });

  it('clears timer and does not schedule after immediate operation success', async () => {
    const renew = jest.fn().mockResolvedValue(true);

    await expect(
      runWithActiveLeaseHeartbeat(() => Promise.resolve('done'), {
        cadenceMs: 10,
        renew,
      }),
    ).resolves.toEqual({
      status: 'fulfilled',
      value: 'done',
      ownershipLost: false,
    });

    await jest.advanceTimersByTimeAsync(100);
    expect(renew).not.toHaveBeenCalled();
  });
});

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value?: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolveDeferred!: (value: T | PromiseLike<T>) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return {
    promise,
    resolve: (value?: T) => resolveDeferred(value as T),
    reject: (reason?: unknown) => rejectDeferred(reason),
  };
}
