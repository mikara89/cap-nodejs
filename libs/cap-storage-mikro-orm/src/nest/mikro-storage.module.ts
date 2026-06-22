import { Module, type Provider } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@mikara89/cap-core';
import { CapPublishEntity } from '../entities/cap-publish.entity';
import { CapReceivedEntity } from '../entities/cap-received.entity';
import { MikroPublishStorage } from '../storage/mikro-publish-storage';
import { MikroReceivedStorage } from '../storage/mikro-received-storage';

const storageProviders: Provider[] = [
  {
    provide: PUBLISH_STORAGE,
    useFactory: (em: EntityManager, orm?: MikroORM) =>
      new MikroPublishStorage(em, orm),
    inject: [EntityManager, { token: MikroORM, optional: true }],
  },
  {
    provide: RECEIVED_STORAGE,
    useFactory: (em: EntityManager, orm?: MikroORM) =>
      new MikroReceivedStorage(em, orm),
    inject: [EntityManager, { token: MikroORM, optional: true }],
  },
];

/**
 * NestJS module providing MikroORM-based storage adapters for CAP.
 *
 * Usage:
 * ```ts
 * import { MikroStorageModule } from '@mikara89/cap-storage-mikro-orm';
 *
 * @Module({
 *   imports: [
 *     MikroOrmModule.forRoot({ ... }),
 *     CapModule.forRoot({ imports: [MikroStorageModule, transportModule] }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [MikroOrmModule.forFeature([CapPublishEntity, CapReceivedEntity])],
  providers: storageProviders,
  exports: [PUBLISH_STORAGE, RECEIVED_STORAGE],
})
export class MikroStorageModule {
  static get providers(): Provider[] {
    return storageProviders;
  }
}
