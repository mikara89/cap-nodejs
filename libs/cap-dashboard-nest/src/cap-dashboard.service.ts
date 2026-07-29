import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { CapLogger, PublisherPort } from '@mikara89/cap-core';
import {
  DEFAULT_INBOX_FALLBACK_WINDOW_MS,
  PUBLISH_STORAGE,
  PUBLISHER,
  RECEIVED_STORAGE,
  type PublishStoragePort,
  type ReceivedStoragePort,
} from '@mikara89/cap-core';
import {
  CapDashboardCoreService,
  type CapDashboardServiceOptions,
  type RetryOptions,
} from '@mikara89/cap-dashboard-core';
import {
  CAP_SCHEDULER_OPTIONS,
  CapService,
  type ResolvedCapSchedulerOptions,
} from '@mikara89/cap-nest';
import { CAP_DASHBOARD_OPTIONS } from './cap-dashboard.auth';

const DEFAULT_RETRY_OPTIONS: ResolvedCapSchedulerOptions = {
  batchSize: 200,
  leaseMs: 30_000,
  inboxFallbackWindowMs: DEFAULT_INBOX_FALLBACK_WINDOW_MS,
  maxRetries: 3,
  maxInboxRetries: 3,
  instanceId: 'cap-dashboard',
  disabled: false,
};

@Injectable()
export class CapDashboardService extends CapDashboardCoreService {
  constructor(
    @Inject(PUBLISH_STORAGE) publishStorage: PublishStoragePort,
    @Inject(RECEIVED_STORAGE) receivedStorage: ReceivedStoragePort,
    @Optional() capService?: CapService,
    @Optional() @Inject(PUBLISHER) publisher?: PublisherPort,
    @Optional()
    @Inject(CAP_DASHBOARD_OPTIONS)
    options?: CapDashboardServiceOptions,
    @Optional()
    @Inject(CAP_SCHEDULER_OPTIONS)
    schedulerOptions: ResolvedCapSchedulerOptions = DEFAULT_RETRY_OPTIONS,
  ) {
    const logger = createNestLogger(CapDashboardService.name);
    super({
      publishStorage,
      receivedStorage,
      retryHandler: capService,
      publisher,
      options,
      schedulerOptions: { maxRetries: schedulerOptions.maxRetries },
      logger,
    });
  }
}

function createNestLogger(context: string): CapLogger {
  const logger = new Logger(context);
  return {
    debug: (message, details) => logger.debug(format(message, details)),
    info: (message, details) => logger.log(format(message, details)),
    warn: (message, details) => logger.warn(format(message, details)),
    error: (message, error, details) =>
      logger.error(format(message, details), stackOrMessage(error)),
  };
}

function format(message: string, details?: unknown): string {
  if (details === undefined) return message;
  if (details instanceof Error) return `${message}: ${details.message}`;
  return `${message}: ${stringifyUnknown(details)}`;
}

function stackOrMessage(error?: unknown): string | undefined {
  if (error instanceof Error) return error.stack ?? error.message;
  return error === undefined ? undefined : stringifyUnknown(error);
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    const serialized: string | undefined = JSON.stringify(value);
    return serialized ?? '[unserializable]';
  } catch {
    return '[unserializable]';
  }
}

export type { CapDashboardServiceOptions, RetryOptions };
