import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import type { Options as MikroOptions } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CapTestAppController } from './cap-test-app.controller';
import { CapTestAppService } from './cap-test-app.service';
import { CapModule, PUBLISHER, SUBSCRIBER, LocalBus } from '@cap/cap-nest';
import { CapExampleHandler } from './cap-example.handler';
import {
  MikroStorageModule,
  CapPublishEntity,
  CapReceivedEntity,
} from '@cap/mikroorm-storage';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

// In-memory transport for local development (no external dependencies)

const InMemPublisher = { provide: PUBLISHER, useClass: LocalBus };

const InMemSubscriber = { provide: SUBSCRIBER, useExisting: PUBLISHER };

@Module({
  imports: [
    // MikroORM configured to use an in-memory SQLite database for tests
    MikroOrmModule.forRootAsync({
      useFactory: (): MikroOptions =>
        ({
          driver: SqliteDriver,
          dbName: ':memory:',
          entities: [CapPublishEntity, CapReceivedEntity],
          allowGlobalContext: true,
        }) as unknown as MikroOptions,
    }),
    // ensure the storage module registers the entities with MikroORM
    MikroStorageModule,
    // register CAP using the Mikro storage adapter and in-memory transport

    CapModule.forRoot({
      storage: MikroStorageModule.providers,
      transport: [InMemPublisher, InMemSubscriber],
    }),
  ],
  controllers: [CapTestAppController],
  providers: [
    CapTestAppService,
    CapExampleHandler,
    // Create DB schema on startup for in-memory SQLite used in tests/dev
    (function () {
      @Injectable()
      class MikroSchemaInit implements OnModuleInit {
        constructor(private readonly orm: MikroORM) {}
        async onModuleInit(): Promise<void> {
          const generator = this.orm.getSchemaGenerator();
          await generator.createSchema();
        }
      }
      return MikroSchemaInit;
    })(),
  ],
})
export class CapTestAppModule {}
