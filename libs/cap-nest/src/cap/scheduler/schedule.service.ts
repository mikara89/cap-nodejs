import {
  Injectable,
  Inject,
  Logger,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

import {
  PUBLISH_STORAGE,
  IPublishStorage,
  RECEIVED_STORAGE,
  IReceivedStorage,
} from '../abstractions/storage.interface';
import { PUBLISHER, IPublisher } from '../abstractions/transport.interface';
import { CapService } from '../cap.service';
import {
  CAP_SCHEDULER_OPTIONS,
  ResolvedCapSchedulerOptions,
} from '../cap.options';
import { withCapMessageId } from '../utils/cap-message-id.util';
import { expJitter } from './backoff.util';

export const CAP_JOB_PREFIX = 'cap-nest:';

@Injectable()
export class RetrySchedulerService implements OnModuleDestroy {
  private readonly log = new Logger(RetrySchedulerService.name);

  constructor(
    @Inject(PUBLISH_STORAGE) private readonly pubStore: IPublishStorage,
    @Inject(PUBLISHER) private readonly publisher: IPublisher,
    @Inject(RECEIVED_STORAGE) private readonly recStore: IReceivedStorage,
    private readonly cap: CapService,
    @Inject(CAP_SCHEDULER_OPTIONS)
    private readonly options: ResolvedCapSchedulerOptions,
    @Optional() private readonly schedulerRegistry?: SchedulerRegistry,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: `${CAP_JOB_PREFIX}flush-outbox`,
  })
  async flushOutbox(): Promise<void> {
    if (this.options.disabled) return;

    const now = new Date();
    await this.pubStore.releaseExpiredClaims(now);

    const batch = await this.pubStore.claimUnpublished({
      limit: this.options.batchSize,
      lockedBy: this.options.instanceId,
      lockUntil: new Date(now.getTime() + this.options.leaseMs),
      now,
    });

    if (batch.length) {
      this.log.verbose(`Outbox flush - attempting ${batch.length} msg(s)`);
    }

    for (const evt of batch) {
      try {
        const headers = withCapMessageId(evt.headers, evt.id);
        await this.publisher.emit(evt.topic, evt.payload, headers, {
          messageId: evt.id,
        });
        await this.pubStore.markPublished(evt.id, new Date());
        this.log.debug(`published outbox #${evt.id}`);
      } catch (err) {
        await this.pubStore.markPublishFailed(evt.id, err, {
          maxRetries: this.options.maxRetries,
          nextRetryAt: new Date(Date.now() + expJitter(evt.retryCount)),
          now: new Date(),
        });

        const message = err instanceof Error ? err.message : String(err);
        this.log.error(
          `outbox #${evt.id} emit failed (${evt.topic}): ${message}`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: `${CAP_JOB_PREFIX}retry-inbox` })
  async retryInbox(): Promise<void> {
    if (this.options.disabled) return;

    const batch = await this.recStore.getRetryDue(this.options.batchSize);
    if (!batch.length) return;

    this.log.verbose(`Inbox retry - ${batch.length} message(s)`);

    for (const rec of batch) {
      await this.cap.retryReceived(rec);
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
