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
} from '@cap/storage-mikro-orm';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const InMemPublisher = { provide: PUBLISHER, useClass: LocalBus };
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    // register CAP using the Mikro storage adapter and an in-memory transport
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    CapModule.forRoot({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
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
        async onModuleInit() {
          const generator = this.orm.getSchemaGenerator();
          await generator.createSchema();
        }
      }
      return MikroSchemaInit;
    })(),
  ],
})
export class CapTestAppModule {}
