import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { DEFAULT_INBOX_FALLBACK_WINDOW_MS } from '@mikara89/cap-core';

import { CapService } from '../cap.service';
import {
  CAP_SCHEDULER_OPTIONS,
  ResolvedCapSchedulerOptions,
} from '../cap.options';

export const CAP_JOB_PREFIX = 'cap-nest:';

@Injectable()
export class RetrySchedulerService implements OnModuleDestroy {
  private readonly log = new Logger(RetrySchedulerService.name);

  constructor(
    private readonly cap: CapService,
    @Optional()
    @Inject(CAP_SCHEDULER_OPTIONS)
    private readonly options: ResolvedCapSchedulerOptions = {
      batchSize: 200,
      leaseMs: 30_000,
      inboxFallbackWindowMs: DEFAULT_INBOX_FALLBACK_WINDOW_MS,
      maxRetries: 3,
      maxInboxRetries: 3,
      instanceId: 'cap-scheduler-default',
      disabled: false,
    },
    @Optional() private readonly schedulerRegistry?: SchedulerRegistry,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: `${CAP_JOB_PREFIX}flush-outbox`,
  })
  async flushOutbox(): Promise<void> {
    if (this.options.disabled) return;
    const count = await this.cap.dispatchOutboxBatch();
    if (count) {
      this.log.verbose(`Outbox flush - attempted ${count} msg(s)`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: `${CAP_JOB_PREFIX}retry-inbox` })
  async retryInbox(): Promise<void> {
    if (this.options.disabled) return;
    const count = await this.cap.retryInboxBatch();
    if (count) {
      this.log.verbose(`Inbox retry - attempted ${count} message(s)`);
    }
  }

  onModuleDestroy(): void {
    const schedulerRegistry = this.schedulerRegistry;
    if (!schedulerRegistry) return;

    try {
      const jobs = schedulerRegistry.getCronJobs();
      jobs.forEach((job, name) => {
        if (!name.startsWith(CAP_JOB_PREFIX)) return;
        try {
          void job.stop();
          schedulerRegistry.deleteCronJob(name);
          this.log.debug(`Stopped and removed CAP cron job: ${name}`);
        } catch (err) {
          this.log.warn(
            `Failed to stop/delete CAP cron job ${name}: ${String(err)}`,
          );
        }
      });
    } catch {
      this.log.debug('No CAP cron jobs to clean up or registry unavailable');
    }
  }
}
