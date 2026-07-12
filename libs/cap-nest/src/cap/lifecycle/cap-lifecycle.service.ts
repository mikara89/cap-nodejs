import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Inject,
} from '@nestjs/common';
import { CapService } from '../cap.service';
import { CAP_INIT } from '../tokens';

/**
 * Internal lifecycle coordinator that wires CAP subscription startup
 * and shutdown into the NestJS application lifecycle.
 *
 * 1. Waits for adapter initialization (CAP_INIT provider) to complete.
 * 2. Awaits `cap.startSubscriptions()` during `onApplicationBootstrap`.
 * 3. Awaits `cap.close()` during `onApplicationShutdown`.
 *
 * Subscription attachment failures propagate through bootstrap rejection.
 */
@Injectable()
export class CapLifecycleService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly log = new Logger(CapLifecycleService.name);
  private closed = false;

  constructor(
    private readonly cap: CapService,
    @Inject(CAP_INIT) private readonly capInit: unknown,
  ) {
    // CAP_INIT is injected solely to establish dependency ordering:
    // adapter initialization must complete before subscription startup.
    void capInit;
  }

  async onApplicationBootstrap(): Promise<void> {
    this.log.debug('Starting CAP subscriptions...');
    try {
      await this.cap.startSubscriptions();
      this.log.log('CAP subscriptions started successfully');
    } catch (err) {
      this.log.error(
        'CAP subscription startup failed',
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.log.debug('Stopping CAP subscriptions...');
    try {
      await this.cap.close();
      this.log.log('CAP subscriptions stopped');
    } catch (err) {
      this.log.error(
        'CAP subscription shutdown failed',
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
  }
}
