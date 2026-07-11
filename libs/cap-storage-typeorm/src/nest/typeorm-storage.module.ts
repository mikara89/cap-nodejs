import { DynamicModule, Module } from '@nestjs/common';
import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
  Provider,
  Type,
} from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@mikara89/cap-core';
import { TypeOrmPublishStorage } from '../typeorm-publish-storage';
import { TypeOrmReceivedStorage } from '../typeorm-received-storage';
import type { TypeOrmStorageOptions } from '../typeorm-storage-options';

const TYPEORM_STORAGE_OPTIONS = Symbol('CAP_TYPEORM_STORAGE_OPTIONS');

export interface TypeOrmStorageModuleOptions {
  dataSource?: DataSource | string;
  imports?: ModuleMetadata['imports'];
  storageOptions?: TypeOrmStorageOptions;
}

export interface TypeOrmStorageOptionsFactory {
  createTypeOrmStorageOptions():
    | Promise<TypeOrmStorageOptions>
    | TypeOrmStorageOptions;
}

export interface TypeOrmStorageModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  dataSource?: DataSource | string;
  useExisting?: Type<TypeOrmStorageOptionsFactory>;
  useClass?: Type<TypeOrmStorageOptionsFactory>;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<TypeOrmStorageOptions> | TypeOrmStorageOptions;
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}

/** NestJS module providing TypeORM-based storage adapters for CAP. */
@Module({})
export class TypeOrmStorageModule {
  static forRoot(options: TypeOrmStorageModuleOptions = {}): DynamicModule {
    return createModule(
      getDataSourceToken(options.dataSource),
      options.imports ?? [],
      {
        provide: TYPEORM_STORAGE_OPTIONS,
        useValue: options.storageOptions ?? {},
      },
    );
  }

  static forRootAsync(
    options: TypeOrmStorageModuleAsyncOptions,
  ): DynamicModule {
    return createModule(
      getDataSourceToken(options.dataSource),
      options.imports ?? [],
      createAsyncOptionsProvider(options),
      options.useClass && !options.useExisting ? [options.useClass] : [],
    );
  }
}

function createModule(
  dataSourceToken: InjectionToken,
  imports: NonNullable<ModuleMetadata['imports']>,
  optionsProvider: Provider,
  extraProviders: Provider[] = [],
): DynamicModule {
  return {
    module: TypeOrmStorageModule,
    imports,
    providers: [
      ...extraProviders,
      optionsProvider,
      {
        provide: PUBLISH_STORAGE,
        useFactory: (dataSource: DataSource, options: TypeOrmStorageOptions) =>
          new TypeOrmPublishStorage(dataSource, options),
        inject: [dataSourceToken, TYPEORM_STORAGE_OPTIONS],
      },
      {
        provide: RECEIVED_STORAGE,
        useFactory: (dataSource: DataSource, options: TypeOrmStorageOptions) =>
          new TypeOrmReceivedStorage(dataSource, options),
        inject: [dataSourceToken, TYPEORM_STORAGE_OPTIONS],
      },
    ],
    exports: [PUBLISH_STORAGE, RECEIVED_STORAGE],
  };
}

function createAsyncOptionsProvider(
  options: TypeOrmStorageModuleAsyncOptions,
): Provider {
  if (options.useFactory) {
    return {
      provide: TYPEORM_STORAGE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
  }
  const factoryToken = options.useExisting ?? options.useClass;
  if (!factoryToken) {
    throw new Error(
      'Invalid TypeOrmStorageModuleAsyncOptions: must provide useFactory, useExisting, or useClass',
    );
  }
  return {
    provide: TYPEORM_STORAGE_OPTIONS,
    useFactory: (factory: TypeOrmStorageOptionsFactory) =>
      factory.createTypeOrmStorageOptions(),
    inject: [factoryToken],
  };
}
