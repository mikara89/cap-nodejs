// src/cap/scheduler/schedule.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  PUBLISH_STORAGE,
  IPublishStorage,
  RECEIVED_STORAGE,
  IReceivedStorage,
} from '../abstractions/storage.interface';
import { PUBLISHER, IPublisher } from '../abstractions/transport.interface';
import { CapService } from '../cap.service';

@Injectable()
export class RetrySchedulerService {
  private readonly log = new Logger(RetrySchedulerService.name);

  constructor(
    @Inject(PUBLISH_STORAGE) private readonly pubStore: IPublishStorage,
    @Inject(PUBLISHER) private readonly publisher: IPublisher,
    @Inject(RECEIVED_STORAGE) private readonly recStore: IReceivedStorage,
    private readonly cap: CapService,
  ) {}

  /** every 30 s flush the outbox */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async flushOutbox(): Promise<void> {
    const batch = await this.pubStore.getUnpublished(200);
    if (batch.length) {
      this.log.verbose(`Outbox flush - attempting ${batch.length} msg(s)`);
    }

    for (const evt of batch) {
      try {
        await this.publisher.emit(evt.topic, evt.payload);
        await this.pubStore.markPublished(evt.id);
        this.log.debug(`✓ outbox #${evt.id} published`);
      } catch (err) {
        // Leave the record untouched; next run will retry.
        const baseLogMessage = `✗ outbox #${evt.id} emit failed (${evt.topic})`;

        if (err instanceof Error) {
          this.log.error(`${baseLogMessage}: ${err.message}`);
          // err.stack includes the error message and provides more context.
          // Fallback if err.stack is undefined.
          this.log.debug(
            `Stack trace for #${evt.id}: ${err.stack ?? 'Stack trace not available'}`,
          );
        } else {
          const unknownErrorAsString = String(err);
          this.log.error(`${baseLogMessage}: ${unknownErrorAsString}`);
          // For non-Error types, the string representation is often the best detail available.
          this.log.debug(
            `Error details for #${evt.id} (non-Error type): ${unknownErrorAsString}`,
          );
        }
      }
    }
  }
  /** every minute retry failed *inbox* messages */
  @Cron(CronExpression.EVERY_MINUTE)
  async retryInbox(): Promise<void> {
    const batch = await this.recStore.getRetryDue(200);
    if (!batch.length) return;

    this.log.verbose(`Inbox retry - ${batch.length} message(s)`);

    for (const rec of batch) {
      await this.cap.retryReceived(rec);
    }
  }
}
