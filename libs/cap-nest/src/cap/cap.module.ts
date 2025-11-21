// ───────────────────────────────────────────────────────────
// src/cap/cap.module.ts
// ───────────────────────────────────────────────────────────
import {
  DynamicModule,
  Global,
  InjectionToken,
  Module,
  OptionalFactoryDependency,
  Provider,
  Type,
} from '@nestjs/common';

import { CapService } from './cap.service';
import { CapSubscriberScanner } from './scanner/cap-subscriber.scanner';
import { CapSchedulerModule } from './scheduler/schedule.module';

/* ───── abstraction tokens ───── */
import {
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
  IPublishStorage,
  IReceivedStorage,
  CapReceivedEvent,
} from './abstractions/storage.interface';
import {
  PUBLISHER,
  SUBSCRIBER,
  IPublisher,
  ISubscriber,
} from './abstractions/transport.interface';
import { CapPublishEvent } from './models/cap-publish-event';
import { AdaptersModule } from './adapters.module';
import { ScheduleModule } from '@nestjs/schedule';

/* --------------------------------------------------------------------
 * 1. Generic options object used by forRoot()
 * ------------------------------------------------------------------ */
export interface CapModuleOptions {
  storage: Provider[]; // must include bindings for PUBLISH_STORAGE & RECEIVED_STORAGE
  transport: Provider[]; // must include bindings for PUBLISHER & SUBSCRIBER
}

/* --------------------------------------------------------------------
 * 2. Convenience “builder” types
 * ------------------------------------------------------------------ */
type Token<T> = Type<T> | Provider;

/**
 * Helper for adapter packages:
 *   CapModule.forAdapters( TypeOrmStorageModule, RabbitTransportModule )
 * Reads the `providers` array exported by the adapter module
 * so callers don’t need to manually copy-paste them.
 */
export interface CapAdapterModule {
  providers: Provider[];
}

/* ------------------------------------------------------------------ */
/*            1.  Async-options interfaces                            */
/* ------------------------------------------------------------------ */
export interface CapModuleFactory {
  /**
   * Return two provider arrays that satisfy the abstraction tokens.
   * They can be sync or Promise-based.
   */
  createCapOptions(): Promise<CapAsyncProviders> | CapAsyncProviders;
}

export interface CapAsyncProviders {
  storage: Provider[]; // must include PUBLISH_STORAGE & RECEIVED_STORAGE
  transport: Provider[]; // must include PUBLISHER & SUBSCRIBER
}

export interface CapModuleAsyncOptions {
  imports?: DynamicModule[];
  useExisting?: Type<CapModuleFactory>;
  useClass?: Type<CapModuleFactory>;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<CapAsyncProviders> | CapAsyncProviders;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}

@Global()
@Module({})
export class CapModule {
  /* --------------------------------------------------------------
   * 2.a  LOW-LEVEL generic factory – accepts raw provider lists
   * ------------------------------------------------------------ */
  static forRoot(opts: CapModuleOptions): DynamicModule {
    const adapterProviders = [...opts.storage, ...opts.transport];
    const adaptersModule = AdaptersModule.register(adapterProviders);
    return {
      module: CapModule,
      imports: [adaptersModule, CapSchedulerModule.attach(adaptersModule)],
      providers: [CapService, CapSubscriberScanner],
      exports: [CapService],
    };
  }

  /* --------------------------------------------------------------
   * 2.b  MID-LEVEL helper – accept two adapter modules
   *      (e.g. @cap/storage-typeorm & @cap/transport-rabbit)
   * ------------------------------------------------------------ */
  static forAdapters(
    storageModule: CapAdapterModule,
    transportModule: CapAdapterModule,
  ): DynamicModule {
    return this.forRoot({
      storage: storageModule.providers,
      transport: transportModule.providers,
    });
  }

  /* --------------------------------------------------------------
   * 2.c  OUT-OF-THE-BOX in-memory “test” bundle
   *      (kept inside core for quick unit-tests)
   * ------------------------------------------------------------ */
  static forInMemory(): DynamicModule {
    const InMemPublishStorage: Token<IPublishStorage> = {
      provide: PUBLISH_STORAGE,
      useClass: class implements IPublishStorage {
        private readonly m = new Map<string, CapPublishEvent<unknown>>();

        async savePublish(e: CapPublishEvent<unknown>): Promise<string> {
          this.m.set(e.id, e);
          return Promise.resolve(e.id);
        }

        markPublished(id: string): Promise<void> {
          const event = this.m.get(id);
          if (event) {
            event.status = 'published';
          }
          return Promise.resolve();
        }

        getUnpublished(n: number): Promise<CapPublishEvent<unknown>[]> {
          return Promise.resolve(
            [...this.m.values()]
              .filter(
                (v) =>
                  v.status === undefined ||
                  (v.status === 'failed' && v.retryCount < 3),
              )
              .slice(0, n),
          );
        }
      },
    };

    const InMemReceivedStorage: Token<IReceivedStorage> = {
      provide: RECEIVED_STORAGE,
      useClass: class implements IReceivedStorage {
        scheduleRetry(
          id: string,
          retryCount: number,
          nextRetry: Date,
        ): Promise<void> {
          const event = this.m.get(id);
          if (event) {
            event.retryCount = retryCount;
            event.nextRetry = nextRetry;
            // Optionally, you might want to reset the processed flag
            // if a retry is scheduled after it was marked processed,
            // though current logic in getRetryDue doesn't check 'processed'.
            // event.processed = false;
            return Promise.resolve();
          }
          return Promise.reject(
            new Error(`Event with id ${id} not found for scheduling retry.`),
          );
        }
        private readonly m = new Map<string, CapReceivedEvent<unknown>>();
        async saveReceived(e: CapReceivedEvent<unknown>): Promise<string> {
          this.m.set(e.id, e);
          return Promise.resolve<string>(e.id);
        }
        markProcessed(id: string): Promise<void> {
          const event = this.m.get(id);
          if (event) {
            event.processed = true;
            return Promise.resolve();
          }
          return Promise.reject(new Error(`Event with id ${id} not found`));
        }
        /** fetch due rows (processed = false AND nextRetry <= now) */
        getRetryDue(limit: number): Promise<CapReceivedEvent[]> {
          const now = Date.now();
          const pendingRetries = [...this.m.values()]
            .filter((rec) => !rec.processed && rec.nextRetry)
            .slice(0, limit);

          if (pendingRetries.length > 0) {
            pendingRetries.forEach((rec) => {
              if (rec.nextRetry && rec.nextRetry.getTime() <= now) {
                console.log(
                  `Retrying event ${rec.id} for topic ${rec.topic} at ${new Date().toISOString()}`,
                );
              }
            });
          }
          return Promise.resolve(pendingRetries);
        }
      },
    };

    return this.forRoot({
      storage: [InMemPublishStorage, InMemReceivedStorage],
      transport: [
        { provide: PUBLISHER, useClass: LocalBus },
        { provide: SUBSCRIBER, useExisting: PUBLISHER }, // same instance
      ],
    });
  }

  /* ---------------------------- ASYNC  variant ------------------------ */
  static forRootAsync(opts: CapModuleAsyncOptions): DynamicModule {
    const asyncCfgProvider = createAsyncOptionsProvider(opts);

    // providers that expose the tokens by pulling them from cfg object
    const tokenProviders: Provider[] = [
      PUBLISH_STORAGE,
      RECEIVED_STORAGE,
      PUBLISHER,
      SUBSCRIBER,
    ].map((token) => ({
      provide: token,
      useFactory: (cfg: CapAsyncProviders) => {
        const list = [...cfg.storage, ...cfg.transport];
        const found = list.find(
          (p) =>
            typeof p === 'object' &&
            p !== null &&
            'provide' in p &&
            (p as { provide: unknown }).provide === token,
        );

        if (!found)
          throw new Error(
            `CAP async config did not supply provider for token ${token.toString()}`,
          );

        // Nest will treat it as value provider or class/factory provider
        // because we return the whole Provider object.
        const f = found as unknown as Record<string, unknown>;
        if ('useValue' in f) return f['useValue'];
        if ('useClass' in f && typeof f['useClass'] === 'function') {
          const C = f['useClass'] as new () => unknown;
          return new C();
        }
        if ('useFactory' in f && typeof f['useFactory'] === 'function') {
          const factory = f['useFactory'] as (...args: unknown[]) => unknown;
          return factory();
        }
        return undefined as unknown;
      },
      inject: ['CAP_ASYNC_CFG'],
    }));

    return {
      module: CapModule,
      imports: [
        ...(opts.imports ?? []),
        ScheduleModule.forRoot(),
        // If user passed useClass but not useExisting, we have to declare it
        ...(opts.useClass && !opts.useExisting ? [opts.useClass] : []),
      ],
      providers: [
        asyncCfgProvider,
        ...tokenProviders,
        CapService,
        CapSubscriberScanner,
      ],
      exports: [CapService],
    };
  }
}
// simple EventEmitter shared by publisher + subscriber
export class LocalBus implements IPublisher, ISubscriber {
  private readonly listeners = new Map<
    string,
    Set<(p: unknown) => Promise<void>>
  >();

  async emit(topic: string, payload: unknown): Promise<void> {
    const handlers = this.listeners.get(topic);
    if (handlers && handlers.size > 0) {
      await Promise.all(Array.from(handlers).map((fn) => fn(payload)));
    }
    return Promise.resolve();
  }

  async consume(
    topic: string,
    _group: string,
    on: (payload: unknown) => Promise<void>,
  ): Promise<void> {
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());

    const listeners = this.listeners.get(topic);
    if (!listeners) {
      throw new Error(`Listeners set for topic ${topic} is undefined`);
    }

    listeners.add(on);
    return Promise.resolve();
  }
}

function createAsyncOptionsProvider(opts: CapModuleAsyncOptions): Provider {
  if (opts.useFactory) {
    return {
      provide: 'CAP_ASYNC_CFG',
      useFactory: opts.useFactory,
      inject: opts.inject ?? [],
    };
  }

  // class-based or existing provider
  const injectType = opts.useExisting ?? opts.useClass;
  if (!injectType) {
    throw new Error(
      'Invalid CapModuleAsyncOptions: must provide useFactory, useExisting, or useClass',
    );
  }
  return {
    provide: 'CAP_ASYNC_CFG',
    async useFactory(factory: CapModuleFactory) {
      return factory.createCapOptions();
    },
    inject: [injectType],
  };
}
