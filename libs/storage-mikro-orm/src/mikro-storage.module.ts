import { ClassProvider, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@cap/cap-nest';
import { CapPublishEntity } from './entities/cap-publish.entity';
import { CapReceivedEntity } from './entities/cap-received.entity';
import { MikroPublishStorage } from './storage/mikro-publish-storage';
import { MikroReceivedStorage } from './storage/mikro-received-storage';

/**
 * NestJS module providing MikroORM-based storage adapters for CAP.
 *
 * Usage:
 * ```ts
 * import { CapModule } from '@cap/cap-nest';
 * import { MikroStorageModule } from '@cap/storage-mikro-orm';
 *
 * @Module({
 *   imports: [
 *     MikroOrmModule.forRoot({ ... }),
 *     CapModule.forAdapters(MikroStorageModule, transportModule),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [MikroOrmModule.forFeature([CapPublishEntity, CapReceivedEntity])],
  providers: [
    {
      provide: PUBLISH_STORAGE,
      useClass: MikroPublishStorage,
    },
    {
      provide: RECEIVED_STORAGE,
      useClass: MikroReceivedStorage,
    },
  ],
  exports: [PUBLISH_STORAGE, RECEIVED_STORAGE],
})
export class MikroStorageModule {
  static get providers(): Array<ClassProvider> {
    return [
      {
        provide: PUBLISH_STORAGE,
        useClass: MikroPublishStorage,
      },
      {
        provide: RECEIVED_STORAGE,
        useClass: MikroReceivedStorage,
      },
    ];
  }
}
