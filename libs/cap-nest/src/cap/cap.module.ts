import { Global, Module } from '@nestjs/common';
import type {
  DynamicModule,
  InjectionToken,
  OptionalFactoryDependency,
  Provider,
  Type,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { CapService } from './cap.service';
import { CapSubscriberScanner } from './scanner/cap-subscriber.scanner';
import { CapSchedulerModule } from './scheduler/schedule.module';
import {
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
  IPublishStorage,
  IReceivedStorage,
  CapReceivedEvent,
  ClaimUnpublishedOptions,
  MarkReceivedFailedOptions,
  MarkPublishFailedOptions,
  TrySaveReceivedResult,
} from './abstractions/storage.interface';
import {
  PUBLISHER,
  SUBSCRIBER,
  IPublisher,
  ISubscriber,
  CapDeliveryMetadata,
  CapPublishMetadata,
} from './abstractions/transport.interface';
import type { CapHeaders } from './models/cap-headers.type';
import type { InitOptions } from './abstractions/initializer.interface';
import { CapPublishEvent } from './models/cap-publish-event';
import type { JsonValue } from './models/json-value.type';
import {
  CAP_MODULE_OPTIONS,
  CAP_SCHEDULER_OPTIONS,
  CapModuleOptions,
  ResolvedCapSchedulerOptions,
} from './cap.options';

export interface CapModuleFactory {
  createCapOptions(): Promise<CapModuleOptions> | CapModuleOptions;
}

export interface CapModuleAsyncOptions {
  imports?: CapModuleOptions['imports'];
  useExisting?: Type<CapModuleFactory>;
  useClass?: Type<CapModuleFactory>;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<CapModuleOptions> | CapModuleOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}

type CapModuleImport = NonNullable<CapModuleOptions['imports']>[number];
type CapModuleExport = Exclude<CapModuleImport, Promise<unknown>>;

@Global()
@Module({})
export class CapModule {
  static forRoot(opts: CapModuleOptions = {}): DynamicModule {
    const moduleOptionsProvider: Provider = {
      provide: CAP_MODULE_OPTIONS,
      useValue: opts,
    };

    const schedulerOptionsProvider = createSchedulerOptionsProvider();
    const initProvider = createInitProvider();
    const schedulerDisabled = opts.scheduler?.disabled === true;

    return {
      module: CapModule,
      imports: [
        ...(opts.imports ?? []),
        ...CapSchedulerModule.attach(!schedulerDisabled).imports,
      ],
      providers: [
        moduleOptionsProvider,
        schedulerOptionsProvider,
        CapService,
        CapSubscriberScanner,
        initProvider,
        ...CapSchedulerModule.attach(!schedulerDisabled).providers,
      ],
      exports: [CapService, ...exportableImports(opts.imports)],
    };
  }

  static forRootAsync(opts: CapModuleAsyncOptions): DynamicModule {
    const asyncOptionsProvider = createAsyncOptionsProvider(opts);
    const schedulerOptionsProvider = createSchedulerOptionsProvider();
    const initProvider = createInitProvider();

    return {
      module: CapModule,
      imports: [
        ...(opts.imports ?? []),
        ...CapSchedulerModule.attach(true).imports,
      ],
      providers: [
        ...(opts.useClass && !opts.useExisting ? [opts.useClass] : []),
        asyncOptionsProvider,
        schedulerOptionsProvider,
        CapService,
        CapSubscriberScanner,
        initProvider,
        ...CapSchedulerModule.attach(true).providers,
      ],
      exports: [CapService, ...exportableImports(opts.imports)],
    };
  }

  static forInMemory(
    options: Omit<CapModuleOptions, 'imports'> = {},
  ): DynamicModule {
    return this.forRoot({
      ...options,
      imports: [createInMemoryAdaptersModule()],
    });
  }
}

export class LocalBus implements IPublisher, ISubscriber {
  private readonly listeners = new Map<
    string,
    Set<(p: unknown, h?: CapHeaders, m?: CapDeliveryMetadata) => Promise<void>>
  >();

  async emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: CapPublishMetadata,
  ): Promise<void> {
    const handlers = this.listeners.get(topic);
    if (handlers && handlers.size > 0) {
      await Promise.all(
        Array.from(handlers).map((fn) =>
          fn(payload, headers, {
            messageId: metadata?.messageId,
            dedupeKey: metadata?.messageId
              ? `${topic}|${metadata.messageId}`
              : undefined,
          }),
        ),
      );
    }
  }

  consume(
    topic: string,
    _group: string,
    on: (
      payload: unknown,
      headers?: CapHeaders,
      metadata?: CapDeliveryMetadata,
    ) => Promise<void>,
  ): Promise<void> {
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());
    this.listeners.get(topic)?.add(on);
    return Promise.resolve();
  }
}

function createAsyncOptionsProvider(opts: CapModuleAsyncOptions): Provider {
  if (opts.useFactory) {
    return {
      provide: CAP_MODULE_OPTIONS,
      useFactory: opts.useFactory,
      inject: opts.inject ?? [],
    };
  }

  const injectType = opts.useExisting ?? opts.useClass;
  if (!injectType) {
    throw new Error(
      'Invalid CapModuleAsyncOptions: must provide useFactory, useExisting, or useClass',
    );
  }

  return {
    provide: CAP_MODULE_OPTIONS,
    async useFactory(factory: CapModuleFactory): Promise<CapModuleOptions> {
      return factory.createCapOptions();
    },
    inject: [injectType],
  };
}

function exportableImports(
  imports: CapModuleOptions['imports'],
): CapModuleExport[] {
  return (imports ?? []).filter(
    (moduleImport): moduleImport is CapModuleExport =>
      !(moduleImport instanceof Promise),
  );
}

function createSchedulerOptionsProvider(): Provider {
  return {
    provide: CAP_SCHEDULER_OPTIONS,
    useFactory: (
      options: CapModuleOptions = {},
    ): ResolvedCapSchedulerOptions => {
      const scheduler = options.scheduler ?? {};
      return {
        batchSize: scheduler.batchSize ?? 200,
        leaseMs: scheduler.leaseMs ?? 30_000,
        maxRetries: scheduler.maxRetries ?? 3,
        maxInboxRetries: scheduler.maxInboxRetries ?? scheduler.maxRetries ?? 3,
        instanceId:
          scheduler.instanceId ??
          `cap-${process.pid}-${randomUUID().slice(0, 8)}`,
        disabled: scheduler.disabled ?? false,
      };
    },
    inject: [CAP_MODULE_OPTIONS],
  };
}

function createInitProvider(): Provider {
  return {
    provide: 'CAP_INIT',
    useFactory: async (
      options: CapModuleOptions,
      pubStorage: IPublishStorage,
      recStorage: IReceivedStorage,
      publisher: IPublisher,
      subscriber: ISubscriber,
    ) => {
      const init = options.init;
      if (!init) return;

      const adapters: Array<{
        initialize?: (options?: InitOptions) => Promise<void>;
      }> = [pubStorage, recStorage, publisher, subscriber];

      await Promise.all(
        adapters.map(async (adapter) => {
          if (typeof adapter?.initialize === 'function') {
            await adapter.initialize(init);
          }
        }),
      );
    },
    inject: [
      CAP_MODULE_OPTIONS,
      PUBLISH_STORAGE,
      RECEIVED_STORAGE,
      PUBLISHER,
      SUBSCRIBER,
    ],
  };
}

function createInMemoryAdaptersModule(): DynamicModule {
  class InMemPublishStorage implements IPublishStorage {
    private readonly m = new Map<string, CapPublishEvent<JsonValue>>();

    savePublish<T extends JsonValue = JsonValue>(
      e: CapPublishEvent<T>,
    ): Promise<string> {
      this.m.set(e.id, e);
      return Promise.resolve(e.id);
    }

    claimUnpublished(
      options: ClaimUnpublishedOptions,
    ): Promise<CapPublishEvent<JsonValue>[]> {
      const claimed: CapPublishEvent<JsonValue>[] = [];
      for (const event of this.m.values()) {
        if (claimed.length >= options.limit) break;
        if (!isClaimable(event, options.now)) continue;
        event.status = 'processing';
        event.lockedBy = options.lockedBy;
        event.lockedUntil = options.lockUntil;
        claimed.push({ ...event });
      }
      return Promise.resolve(claimed);
    }

    markPublished(id: string, publishedAt = new Date()): Promise<void> {
      const event = this.m.get(id);
      if (!event) return Promise.resolve();
      event.status = 'published';
      event.publishedAt = publishedAt;
      event.lockedBy = null;
      event.lockedUntil = null;
      return Promise.resolve();
    }

    markPublishFailed(
      id: string,
      error: unknown,
      options: MarkPublishFailedOptions,
    ): Promise<void> {
      const event = this.m.get(id);
      if (!event) return Promise.resolve();
      const nextRetryCount = event.retryCount + 1;
      event.retryCount = nextRetryCount;
      event.status =
        nextRetryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      event.nextRetryAt =
        event.status === 'dead_letter' ? null : options.nextRetryAt;
      event.lastError = error instanceof Error ? error.message : String(error);
      event.lockedBy = null;
      event.lockedUntil = null;
      return Promise.resolve();
    }

    releaseExpiredClaims(now: Date): Promise<void> {
      for (const event of this.m.values()) {
        if (
          event.status === 'processing' &&
          event.lockedUntil &&
          event.lockedUntil <= now
        ) {
          event.status = 'failed';
          event.lockedBy = null;
          event.lockedUntil = null;
        }
      }
      return Promise.resolve();
    }

    findPublishById(
      id: string,
    ): Promise<CapPublishEvent<JsonValue> | undefined> {
      const event = this.m.get(id);
      return Promise.resolve(event ? { ...event } : undefined);
    }

    listPublish(
      opts: {
        limit?: number;
        offset?: number;
        topic?: string;
        onlyUnpublished?: boolean;
      } = {},
    ): Promise<{ items: CapPublishEvent<JsonValue>[]; total: number }> {
      let filtered = [...this.m.values()];
      if (opts.topic) filtered = filtered.filter((v) => v.topic === opts.topic);
      if (opts.onlyUnpublished) {
        filtered = filtered.filter((v) => isClaimable(v, new Date()));
      }
      const total = filtered.length;
      const offset = opts.offset ?? 0;
      return Promise.resolve({
        items: filtered.slice(offset, offset + (opts.limit ?? total)),
        total,
      });
    }
  }

  class InMemReceivedStorage implements IReceivedStorage {
    private readonly m = new Map<string, CapReceivedEvent<JsonValue>>();
    private readonly dedupe = new Map<string, string>();

    private dedupeIdentity(
      e: Pick<CapReceivedEvent, 'group' | 'dedupeKey'>,
    ): string {
      return `${e.group}|${e.dedupeKey}`;
    }

    trySaveReceived<T extends JsonValue = JsonValue>(
      e: CapReceivedEvent<T>,
    ): Promise<TrySaveReceivedResult<T>> {
      const dedupeIdentity = this.dedupeIdentity(e);
      const existingId = this.dedupe.get(dedupeIdentity);
      if (existingId) {
        const existing = this.m.get(existingId) as CapReceivedEvent<T>;
        return Promise.resolve({
          inserted: false,
          id: existingId,
          event: existing,
        });
      }

      this.m.set(e.id, e);
      this.dedupe.set(dedupeIdentity, e.id);
      return Promise.resolve({ inserted: true, id: e.id, event: e });
    }

    markProcessed(id: string): Promise<void> {
      const event = this.m.get(id);
      if (event) {
        event.status = 'processed';
        event.processed = true;
        event.processedAt = new Date();
        event.nextRetry = null;
      }
      return Promise.resolve();
    }

    getRetryDue(limit: number): Promise<CapReceivedEvent<JsonValue>[]> {
      const now = Date.now();
      return Promise.resolve(
        [...this.m.values()]
          .filter(
            (rec) =>
              rec.status === 'failed' &&
              rec.nextRetry &&
              rec.nextRetry.getTime() <= now,
          )
          .slice(0, limit)
          .map((rec) => ({ ...rec })),
      );
    }

    markReceivedFailed(
      id: string,
      error: unknown,
      options: MarkReceivedFailedOptions,
    ): Promise<void> {
      const event = this.m.get(id);
      if (!event) return Promise.resolve();
      const retryCount = event.retryCount + 1;
      event.retryCount = retryCount;
      event.status =
        retryCount >= options.maxRetries ? 'dead_letter' : 'failed';
      event.nextRetry =
        event.status === 'dead_letter' ? null : options.nextRetryAt;
      event.lastError = error instanceof Error ? error.message : String(error);
      return Promise.resolve();
    }

    findReceivedById(
      id: string,
    ): Promise<CapReceivedEvent<JsonValue> | undefined> {
      const event = this.m.get(id);
      return Promise.resolve(event ? { ...event } : undefined);
    }

    listReceived(
      opts: {
        limit?: number;
        offset?: number;
        topic?: string;
        due?: boolean;
      } = {},
    ): Promise<{ items: CapReceivedEvent<JsonValue>[]; total: number }> {
      let all = [...this.m.values()];
      if (opts.topic) all = all.filter((r) => r.topic === opts.topic);
      if (opts.due) {
        const now = Date.now();
        all = all.filter(
          (r) =>
            r.status === 'failed' &&
            r.nextRetry &&
            r.nextRetry.getTime() <= now,
        );
      }
      const total = all.length;
      const offset = opts.offset ?? 0;
      return Promise.resolve({
        items: all.slice(offset, offset + (opts.limit ?? total)),
        total,
      });
    }
  }

  return {
    module: class CapInMemoryAdaptersModule {},
    providers: [
      { provide: PUBLISH_STORAGE, useClass: InMemPublishStorage },
      { provide: RECEIVED_STORAGE, useClass: InMemReceivedStorage },
      { provide: PUBLISHER, useClass: LocalBus },
      { provide: SUBSCRIBER, useExisting: PUBLISHER },
    ],
    exports: [PUBLISH_STORAGE, RECEIVED_STORAGE, PUBLISHER, SUBSCRIBER],
  };
}

function isClaimable(event: CapPublishEvent, now: Date): boolean {
  if (event.status === 'pending') return true;
  if (event.status === 'failed') {
    return !event.nextRetryAt || event.nextRetryAt <= now;
  }
  if (event.status === 'processing') {
    return Boolean(event.lockedUntil && event.lockedUntil <= now);
  }
  return false;
}
