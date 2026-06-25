import { Global, Module } from '@nestjs/common';
import type {
  DynamicModule,
  InjectionToken,
  OptionalFactoryDependency,
  Provider,
  Type,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CapEngine,
  InMemoryPublishStorage,
  InMemoryReceivedStorage,
  LocalBus as CoreLocalBus,
} from '@mikara89/cap-core';

import { CapService, createNestLogger } from './cap.service';
import { CAP_ENGINE } from './tokens';
import { CapSubscriberScanner } from './scanner/cap-subscriber.scanner';
import { CapSchedulerModule } from './scheduler/schedule.module';
import {
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
  IPublishStorage,
  IReceivedStorage,
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
    const capEngineProvider = createCapEngineProvider();
    const capServiceProvider = createCapServiceProvider();
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
        capEngineProvider,
        capServiceProvider,
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
    const capEngineProvider = createCapEngineProvider();
    const capServiceProvider = createCapServiceProvider();

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
        capEngineProvider,
        capServiceProvider,
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

export class LocalBus extends CoreLocalBus implements IPublisher, ISubscriber {
  override emit(
    topic: string,
    payload: unknown,
    headers?: CapHeaders,
    metadata?: CapPublishMetadata,
  ): Promise<void> {
    return super.emit(topic, payload as JsonValue, headers, metadata);
  }

  override consume(
    topic: string,
    group: string,
    on: (
      payload: unknown,
      headers?: CapHeaders,
      metadata?: CapDeliveryMetadata,
    ) => Promise<void>,
  ): Promise<void> {
    return super.consume(topic, group, on);
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

function createCapEngineProvider(): Provider {
  return {
    provide: CAP_ENGINE,
    useFactory: (
      options: CapModuleOptions,
      pubStorage: IPublishStorage,
      recStorage: IReceivedStorage,
      publisher: IPublisher,
      subscriber: ISubscriber,
      schedulerOptions: ResolvedCapSchedulerOptions,
    ): CapEngine =>
      new CapEngine({
        publishStorage: pubStorage,
        receivedStorage: recStorage,
        publisher,
        subscriber,
        scheduler: schedulerOptions,
        logger: createNestLogger(CapEngine.name),
        transactionManager: options.transactionManager,
        transactionContext: options.transactionContext,
      }),
    inject: [
      CAP_MODULE_OPTIONS,
      PUBLISH_STORAGE,
      RECEIVED_STORAGE,
      PUBLISHER,
      SUBSCRIBER,
      CAP_SCHEDULER_OPTIONS,
    ],
  };
}

function createCapServiceProvider(): Provider {
  return {
    provide: CapService,
    useFactory: (engine: CapEngine): CapService => new CapService(engine),
    inject: [CAP_ENGINE],
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
  return {
    module: class CapInMemoryAdaptersModule {},
    providers: [
      { provide: PUBLISH_STORAGE, useClass: InMemoryPublishStorage },
      { provide: RECEIVED_STORAGE, useClass: InMemoryReceivedStorage },
      { provide: PUBLISHER, useClass: LocalBus },
      { provide: SUBSCRIBER, useExisting: PUBLISHER },
    ],
    exports: [PUBLISH_STORAGE, RECEIVED_STORAGE, PUBLISHER, SUBSCRIBER],
  };
}
