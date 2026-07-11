import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@mikara89/cap-core';
import { KnexPublishStorage } from '../knex-publish-storage';
import { KnexReceivedStorage } from '../knex-received-storage';
import { KnexStorageModule } from './knex-storage.module';

const KNEX = Symbol('APP_KNEX');
const knex = {};

@Module({ providers: [{ provide: KNEX, useValue: knex }], exports: [KNEX] })
class DatabaseModule {}

describe('KnexStorageModule', () => {
  it('registers both CAP storage contracts from an application token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        KnexStorageModule.forRoot({
          knexToken: KNEX,
          imports: [DatabaseModule],
          storageOptions: { publishTableName: 'custom_publish' },
        }),
      ],
    }).compile();

    expect(moduleRef.get(PUBLISH_STORAGE)).toBeInstanceOf(KnexPublishStorage);
    expect(moduleRef.get(RECEIVED_STORAGE)).toBeInstanceOf(KnexReceivedStorage);
  });

  it('supports async storage options', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        KnexStorageModule.forRootAsync({
          knexToken: KNEX,
          imports: [DatabaseModule],
          useFactory: () => ({ receivedTableName: 'custom_received' }),
        }),
      ],
    }).compile();

    expect(moduleRef.get(RECEIVED_STORAGE)).toBeInstanceOf(KnexReceivedStorage);
  });
});
