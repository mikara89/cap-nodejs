export interface ActiveLeaseHeartbeatOptions {
  cadenceMs: number;
  renew?: () => Promise<boolean>;
  onRenewalError?: (error: unknown) => void;
}

export type ActiveLeaseOperationResult<T> =
  | { status: 'fulfilled'; value: T; ownershipLost: boolean }
  | { status: 'rejected'; reason: unknown; ownershipLost: boolean };

/**
 * Runs one operation while recursively renewing its lease. A new renewal is
 * scheduled only after the previous one settles, so renewal calls never
 * overlap. The operation is not cancelled when ownership is lost.
 *
 * This is a package-internal copy of the same utility in @mikara89/cap-core.
 * Keeping it private avoids exposing an implementation detail as public API
 * and allows @mikara89/cap-dashboard-core to remain compatible with older
 * @mikara89/cap-core releases that do not include this helper.
 */
export async function runWithActiveLeaseHeartbeat<T>(
  operation: () => Promise<T>,
  options: ActiveLeaseHeartbeatOptions,
): Promise<ActiveLeaseOperationResult<T>> {
  let ownershipLost = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlightRenewal: Promise<void> | undefined;
  const cadenceMs = Math.max(1, Math.floor(options.cadenceMs));

  const scheduleRenewal = (): void => {
    const renew = options.renew;
    if (stopped || ownershipLost || !renew) return;
    timer = setTimeout(() => {
      inFlightRenewal = renew()
        .then((renewed) => {
          if (!renewed) ownershipLost = true;
        })
        .catch((error: unknown) => {
          ownershipLost = true;
          options.onRenewalError?.(error);
        })
        .finally(() => {
          inFlightRenewal = undefined;
          scheduleRenewal();
        });
    }, cadenceMs);
  };

  scheduleRenewal();
  let result: ActiveLeaseOperationResult<T>;
  try {
    result = { status: 'fulfilled', value: await operation(), ownershipLost };
  } catch (reason) {
    result = { status: 'rejected', reason, ownershipLost };
  } finally {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (inFlightRenewal) await inFlightRenewal;
  }

  return { ...result, ownershipLost };
}
