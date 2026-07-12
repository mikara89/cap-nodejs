import { CapModule } from './cap.module';
import { type DynamicModule } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  type IPublisher,
  PUBLISHER,
  SUBSCRIBER,
} from './abstractions/transport.interface';
import {
  type IReceivedStorage,
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
} from './abstractions/storage.interface';
import { type CapReceivedEvent } from './models/cap-received-event';
import { CAP_ENGINE } from './tokens';
import {
  type CapEngine,
  InMemoryPublishStorage,
  InMemoryReceivedStorage,
  LocalBus,
} from '@mikara89/cap-core';

describe('CapModule builders', () => {
  it('forInMemory returns DynamicModule with adapters containing provider tokens', () => {
    const dm = CapModule.forInMemory();

    // adaptersModule is the first import
    const adapters = dm.imports?.[0] as DynamicModule | undefined;
    expect(adapters).toBeDefined();
    // adapters should expose providers array
    // Providers should include the in-memory storage classes and transport providers
    const providers = adapters?.providers ?? [];

    const hasPublishStorage = providers.some(
      (p) =>
        p && ((p as any).provide === PUBLISH_STORAGE || (p as any).useClass),
    );
    const hasReceivedStorage = providers.some(
      (p) =>
        p && ((p as any).provide === RECEIVED_STORAGE || (p as any).useClass),
    );
    const hasPublisher = providers.some(
      (p) => p && (p as any).provide === PUBLISHER,
    );
    const hasSubscriber = providers.some(
      (p) => p && (p as any).provide === SUBSCRIBER,
    );

    expect(hasPublishStorage).toBe(true);
    expect(hasReceivedStorage).toBe(true);
    expect(hasPublisher).toBe(true);
    expect(hasSubscriber).toBe(true);
  });

  it('forInMemory dedupes received messages by group and dedupeKey', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CapModule.forInMemory({ scheduler: { disabled: true } })],
    }).compile();

    try {
      const storage = moduleRef.get<IReceivedStorage>(RECEIVED_STORAGE);
      const makeEvent = (
        id: string,
        group: string,
        messageId: string,
      ): CapReceivedEvent<{ id: string }> => ({
        id,
        topic: 'user.created',
        occurredAt: new Date().toISOString(),
        payload: { id },
        group,
        messageId,
        dedupeKey: 'stable-business-key',
        retryCount: 0,
        status: 'pending',
        processed: false,
        nextRetry: null,
      });

      const first = await storage.trySaveReceived(
        makeEvent('received-1', 'group-a', 'broker-1'),
      );
      const differentGroup = await storage.trySaveReceived(
        makeEvent('received-2', 'group-b', 'broker-2'),
      );
      const duplicateGroup = await storage.trySaveReceived(
        makeEvent('received-3', 'group-a', 'broker-3'),
      );

      expect(first.inserted).toBe(true);
      expect(differentGroup.inserted).toBe(true);
      expect(duplicateGroup.inserted).toBe(false);
      expect(duplicateGroup.id).toBe('received-1');
    } finally {
      await moduleRef.close();
    }
  });

  it('forInMemory passes message envelope compatibility options to core', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CapModule.forInMemory({
          scheduler: { disabled: true },
          messageEnvelope: { legacyUnversioned: 'reject' },
        }),
      ],
    }).compile();

    try {
      const engine = moduleRef.get<CapEngine>(CAP_ENGINE);
      const publisher = moduleRef.get<IPublisher>(PUBLISHER);
      const handler = jest.fn();
      await engine.subscribe('legacy', 'workers', handler);

      await expect(
        publisher.emit('legacy', { payload: { value: 1 } }),
      ).rejects.toThrow(
        'Legacy unversioned CAP message envelopes are rejected',
      );
      expect(handler).not.toHaveBeenCalled();
    } finally {
      await moduleRef.close();
    }
  });

  it('forRootAsync passes message envelope compatibility options to core', async () => {
    const bus = new LocalBus();
    const adaptersModule: DynamicModule = {
      module: class AsyncEnvelopeAdaptersModule {},
      providers: [
        { provide: PUBLISH_STORAGE, useValue: new InMemoryPublishStorage() },
        { provide: RECEIVED_STORAGE, useValue: new InMemoryReceivedStorage() },
        { provide: PUBLISHER, useValue: bus },
        { provide: SUBSCRIBER, useValue: bus },
      ],
      exports: [PUBLISH_STORAGE, RECEIVED_STORAGE, PUBLISHER, SUBSCRIBER],
    };
    const moduleRef = await Test.createTestingModule({
      imports: [
        CapModule.forRootAsync({
          imports: [adaptersModule],
          useFactory: () => ({
            scheduler: { disabled: true },
            messageEnvelope: { legacyUnversioned: 'reject' as const },
          }),
        }),
      ],
    }).compile();

    try {
      const engine = moduleRef.get<CapEngine>(CAP_ENGINE);
      const handler = jest.fn();
      await engine.subscribe('legacy-async', 'workers', handler);

      await expect(
        bus.emit('legacy-async', { payload: { value: 1 } }),
      ).rejects.toThrow(
        'Legacy unversioned CAP message envelopes are rejected',
      );
      expect(handler).not.toHaveBeenCalled();
    } finally {
      await moduleRef.close();
    }
  });
});
