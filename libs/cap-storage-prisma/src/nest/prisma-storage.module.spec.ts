import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@mikara89/cap-core';
import { PrismaPublishStorage } from '../prisma-publish-storage';
import { PrismaReceivedStorage } from '../prisma-received-storage';
import { PrismaStorageModule } from './prisma-storage.module';

const DATABASE_CLIENT = Symbol('DATABASE_CLIENT');
const PROVIDER = Symbol('PRISMA_PROVIDER');
const client = {};

@Module({
  providers: [
    { provide: DATABASE_CLIENT, useValue: client },
    { provide: PROVIDER, useValue: 'sqlite' },
  ],
  exports: [DATABASE_CLIENT, PROVIDER],
})
class DatabaseModule {}

describe('PrismaStorageModule', () => {
  it('uses the application-supplied client token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PrismaStorageModule.forRoot({
          clientToken: DATABASE_CLIENT,
          imports: [DatabaseModule],
          storageOptions: { provider: 'sqlite' },
        }),
      ],
    }).compile();

    expect(moduleRef.get(PUBLISH_STORAGE)).toBeInstanceOf(PrismaPublishStorage);
    expect(moduleRef.get(RECEIVED_STORAGE)).toBeInstanceOf(
      PrismaReceivedStorage,
    );
  });

  it('supports injected async storage options', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PrismaStorageModule.forRootAsync({
          clientToken: DATABASE_CLIENT,
          imports: [DatabaseModule],
          inject: [PROVIDER],
          useFactory: (provider: unknown) => ({
            provider: provider as 'sqlite',
          }),
        }),
      ],
    }).compile();

    expect(moduleRef.get(PUBLISH_STORAGE)).toBeInstanceOf(PrismaPublishStorage);
  });
});
