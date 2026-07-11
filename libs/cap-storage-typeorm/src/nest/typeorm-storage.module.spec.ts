import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@mikara89/cap-core';
import { TypeOrmPublishStorage } from '../typeorm-publish-storage';
import { TypeOrmReceivedStorage } from '../typeorm-received-storage';
import { TypeOrmStorageModule } from './typeorm-storage.module';

const dataSource = {};
const REPORTING_DATA_SOURCE = getDataSourceToken('reporting');
const DEFAULT_DATA_SOURCE = getDataSourceToken();

@Module({
  providers: [
    { provide: REPORTING_DATA_SOURCE, useValue: dataSource },
    { provide: DEFAULT_DATA_SOURCE, useValue: dataSource },
  ],
  exports: [REPORTING_DATA_SOURCE, DEFAULT_DATA_SOURCE],
})
class DatabaseModule {}

describe('TypeOrmStorageModule', () => {
  it('uses the standard named TypeORM DataSource token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmStorageModule.forRoot({
          dataSource: 'reporting',
          imports: [DatabaseModule],
          storageOptions: { publishTableName: 'custom_publish' },
        }),
      ],
    }).compile();

    expect(moduleRef.get(PUBLISH_STORAGE)).toBeInstanceOf(
      TypeOrmPublishStorage,
    );
    expect(moduleRef.get(RECEIVED_STORAGE)).toBeInstanceOf(
      TypeOrmReceivedStorage,
    );
  });

  it('supports async storage options', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmStorageModule.forRootAsync({
          imports: [DatabaseModule],
          useFactory: () => Promise.resolve({}),
        }),
      ],
    }).compile();

    expect(moduleRef.get(PUBLISH_STORAGE)).toBeInstanceOf(
      TypeOrmPublishStorage,
    );
  });
});
