import { DynamicModule, Module } from '@nestjs/common';
import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Provider,
  Type,
} from '@nestjs/common';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@mikara89/cap-core';
import type { PrismaCapClient } from '../prisma-cap-client';
import { PrismaPublishStorage } from '../prisma-publish-storage';
import { PrismaReceivedStorage } from '../prisma-received-storage';
import type { PrismaStorageOptions } from '../prisma-storage-options';

const PRISMA_STORAGE_OPTIONS = Symbol('CAP_PRISMA_STORAGE_OPTIONS');

export interface PrismaStorageModuleOptions {
  clientToken: InjectionToken;
  imports?: ModuleMetadata['imports'];
  storageOptions: PrismaStorageOptions;
}

export interface PrismaStorageOptionsFactory {
  createPrismaStorageOptions():
    | Promise<PrismaStorageOptions>
    | PrismaStorageOptions;
}

export interface PrismaStorageModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  clientToken: InjectionToken;
  useExisting?: Type<PrismaStorageOptionsFactory>;
  useClass?: Type<PrismaStorageOptionsFactory>;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<PrismaStorageOptions> | PrismaStorageOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}

/** NestJS module providing Prisma-based storage adapters for CAP. */
@Module({})
export class PrismaStorageModule {
  static forRoot(options: PrismaStorageModuleOptions): DynamicModule {
    return createModule(options.clientToken, options.imports ?? [], {
      provide: PRISMA_STORAGE_OPTIONS,
      useValue: options.storageOptions,
    });
  }

  static forRootAsync(options: PrismaStorageModuleAsyncOptions): DynamicModule {
    return createModule(
      options.clientToken,
      options.imports ?? [],
      createAsyncOptionsProvider(options),
      options.useClass && !options.useExisting ? [options.useClass] : [],
    );
  }
}

function createModule(
  clientToken: InjectionToken,
  imports: NonNullable<ModuleMetadata['imports']>,
  optionsProvider: Provider,
  extraProviders: Provider[] = [],
): DynamicModule {
  return {
    module: PrismaStorageModule,
    imports,
    providers: [
      ...extraProviders,
      optionsProvider,
      {
        provide: PUBLISH_STORAGE,
        useFactory: (client: PrismaCapClient, options: PrismaStorageOptions) =>
          new PrismaPublishStorage(client, options),
        inject: [clientToken, PRISMA_STORAGE_OPTIONS],
      },
      {
        provide: RECEIVED_STORAGE,
        useFactory: (client: PrismaCapClient, options: PrismaStorageOptions) =>
          new PrismaReceivedStorage(client, options),
        inject: [clientToken, PRISMA_STORAGE_OPTIONS],
      },
    ],
    exports: [PUBLISH_STORAGE, RECEIVED_STORAGE],
  };
}

function createAsyncOptionsProvider(
  options: PrismaStorageModuleAsyncOptions,
): Provider {
  if (options.useFactory) {
    return {
      provide: PRISMA_STORAGE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
  }
  const factoryToken = options.useExisting ?? options.useClass;
  if (!factoryToken) {
    throw new Error(
      'Invalid PrismaStorageModuleAsyncOptions: must provide useFactory, useExisting, or useClass',
    );
  }
  return {
    provide: PRISMA_STORAGE_OPTIONS,
    useFactory: (factory: PrismaStorageOptionsFactory) =>
      factory.createPrismaStorageOptions(),
    inject: [factoryToken],
  };
}
