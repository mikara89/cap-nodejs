import { DynamicModule, Module } from '@nestjs/common';
import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Provider,
  Type,
} from '@nestjs/common';
import type { Knex } from 'knex';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@mikara89/cap-core';
import { KnexPublishStorage } from '../knex-publish-storage';
import { KnexReceivedStorage } from '../knex-received-storage';
import type { KnexStorageOptions } from '../knex-storage-options';

const KNEX_STORAGE_OPTIONS = Symbol('CAP_KNEX_STORAGE_OPTIONS');

export interface KnexStorageModuleOptions {
  knexToken: InjectionToken;
  imports?: ModuleMetadata['imports'];
  storageOptions?: KnexStorageOptions;
}

export interface KnexStorageOptionsFactory {
  createKnexStorageOptions(): Promise<KnexStorageOptions> | KnexStorageOptions;
}

export interface KnexStorageModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  knexToken: InjectionToken;
  useExisting?: Type<KnexStorageOptionsFactory>;
  useClass?: Type<KnexStorageOptionsFactory>;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<KnexStorageOptions> | KnexStorageOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}

/** NestJS module providing Knex-based storage adapters for CAP. */
@Module({})
export class KnexStorageModule {
  static forRoot(options: KnexStorageModuleOptions): DynamicModule {
    return createModule(options.knexToken, options.imports ?? [], {
      provide: KNEX_STORAGE_OPTIONS,
      useValue: options.storageOptions ?? {},
    });
  }

  static forRootAsync(options: KnexStorageModuleAsyncOptions): DynamicModule {
    return createModule(
      options.knexToken,
      options.imports ?? [],
      createAsyncOptionsProvider(options),
      options.useClass && !options.useExisting ? [options.useClass] : [],
    );
  }
}

function createModule(
  knexToken: InjectionToken,
  imports: NonNullable<ModuleMetadata['imports']>,
  optionsProvider: Provider,
  extraProviders: Provider[] = [],
): DynamicModule {
  return {
    module: KnexStorageModule,
    imports,
    providers: [
      ...extraProviders,
      optionsProvider,
      {
        provide: PUBLISH_STORAGE,
        useFactory: (knex: Knex, options: KnexStorageOptions) =>
          new KnexPublishStorage(knex, options),
        inject: [knexToken, KNEX_STORAGE_OPTIONS],
      },
      {
        provide: RECEIVED_STORAGE,
        useFactory: (knex: Knex, options: KnexStorageOptions) =>
          new KnexReceivedStorage(knex, options),
        inject: [knexToken, KNEX_STORAGE_OPTIONS],
      },
    ],
    exports: [PUBLISH_STORAGE, RECEIVED_STORAGE],
  };
}

function createAsyncOptionsProvider(
  options: KnexStorageModuleAsyncOptions,
): Provider {
  if (options.useFactory) {
    return {
      provide: KNEX_STORAGE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
  }
  const factoryToken = options.useExisting ?? options.useClass;
  if (!factoryToken) {
    throw new Error(
      'Invalid KnexStorageModuleAsyncOptions: must provide useFactory, useExisting, or useClass',
    );
  }
  return {
    provide: KNEX_STORAGE_OPTIONS,
    useFactory: (factory: KnexStorageOptionsFactory) =>
      factory.createKnexStorageOptions(),
    inject: [factoryToken],
  };
}
