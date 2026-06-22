import { type CapEngine } from './cap-engine';
import { type CapLogger } from '../ports/logger.port';

export interface CapSchedulerRuntimeOptions {
  outboxIntervalMs: number;
  inboxRetryIntervalMs: number;
  disabled?: boolean;
}

export class CapScheduler {
  private outboxTimer?: ReturnType<typeof setInterval>;
  private inboxRetryTimer?: ReturnType<typeof setInterval>;
  private outboxRunning?: Promise<number>;
  private inboxRetryRunning?: Promise<number>;

  constructor(
    private readonly engine: CapEngine,
    private readonly options: CapSchedulerRuntimeOptions,
    private readonly logger?: CapLogger,
  ) {}

  start(): void {
    if (this.options.disabled) return;
    this.outboxTimer ??= setInterval(
      () => void this.runOutboxOnce(),
      this.options.outboxIntervalMs,
    );
    this.inboxRetryTimer ??= setInterval(
      () => void this.runInboxRetryOnce(),
      this.options.inboxRetryIntervalMs,
    );
  }

  async stop(): Promise<void> {
    if (this.outboxTimer) {
      clearInterval(this.outboxTimer);
      this.outboxTimer = undefined;
    }
    if (this.inboxRetryTimer) {
      clearInterval(this.inboxRetryTimer);
      this.inboxRetryTimer = undefined;
    }

    await Promise.allSettled([
      this.outboxRunning ?? Promise.resolve(0),
      this.inboxRetryRunning ?? Promise.resolve(0),
    ]);
  }

  runOutboxOnce(): Promise<number> {
    if (this.options.disabled) return Promise.resolve(0);
    if (this.outboxRunning) return this.outboxRunning;

    this.outboxRunning = this.engine
      .dispatchOutboxBatch()
      .catch((error: unknown) => {
        this.logger?.error?.('CAP outbox scheduler run failed', error);
        return 0;
      })
      .finally(() => {
        this.outboxRunning = undefined;
      });

    return this.outboxRunning;
  }

  runInboxRetryOnce(): Promise<number> {
    if (this.options.disabled) return Promise.resolve(0);
    if (this.inboxRetryRunning) return this.inboxRetryRunning;

    this.inboxRetryRunning = this.engine
      .retryInboxBatch()
      .catch((error: unknown) => {
        this.logger?.error?.('CAP inbox retry scheduler run failed', error);
        return 0;
      })
      .finally(() => {
        this.inboxRetryRunning = undefined;
      });

    return this.inboxRetryRunning;
  }
}
