/* eslint-disable @typescript-eslint/unbound-method */

import { Test } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { MikroReceivedStorage } from './mikro-received-storage';
import { CapReceivedEntity } from '../entities/cap-received.entity';
import { type CapReceivedEvent } from '@mikara89/cap-nest';

describe('MikroReceivedStorage', () => {
  let storage: MikroReceivedStorage;
  let em: EntityManager;

  beforeEach(async () => {
    const mockEm = {
      create: jest.fn((_, data) => ({ ...data, id: data.id })),
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      flush: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MikroReceivedStorage,
        { provide: EntityManager, useValue: mockEm },
      ],
    }).compile();

    storage = moduleRef.get(MikroReceivedStorage);
    em = moduleRef.get(EntityManager);
  });

  it('inserts a received event on first delivery', async () => {
    const event = receivedEvent();
    (em.findOne as jest.Mock).mockResolvedValue(null);

    const result = await storage.trySaveReceived(event);

    expect(result.inserted).toBe(true);
    expect(em.findOne).toHaveBeenCalledWith(CapReceivedEntity, {
      group: 'test-group',
      dedupeKey: 'test-topic|test-group|message-1',
    });
    expect(em.persistAndFlush).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-id',
        topic: 'test-topic',
        group: 'test-group',
        messageId: 'message-1',
        dedupeKey: 'test-topic|test-group|message-1',
        payload: { foo: 'bar' },
      }),
    );
  });

  it('returns inserted=false for duplicate deliveries', async () => {
    const existing = receivedEntity();
    (em.findOne as jest.Mock).mockResolvedValue(existing);

    const result = await storage.trySaveReceived(receivedEvent());

    expect(result.inserted).toBe(false);
    expect(result.id).toBe('test-id');
    expect(em.findOne).toHaveBeenCalledWith(CapReceivedEntity, {
      group: 'test-group',
      dedupeKey: 'test-topic|test-group|message-1',
    });
    expect(em.persistAndFlush).not.toHaveBeenCalled();
  });

  it('dedupes by group and dedupeKey even when messageId differs', async () => {
    const existing = receivedEntity({ messageId: 'message-1' });
    (em.findOne as jest.Mock).mockResolvedValue(existing);

    const result = await storage.trySaveReceived(
      receivedEvent({ messageId: 'message-2' }),
    );

    expect(result.inserted).toBe(false);
    expect(em.findOne).toHaveBeenCalledWith(CapReceivedEntity, {
      group: 'test-group',
      dedupeKey: 'test-topic|test-group|message-1',
    });
  });

  it('uses group and dedupeKey in duplicate catch lookup', async () => {
    const existing = receivedEntity({ messageId: 'message-1' });
    (em.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing);
    (em.persistAndFlush as jest.Mock).mockRejectedValueOnce(
      new Error('unique'),
    );

    const result = await storage.trySaveReceived(
      receivedEvent({ messageId: 'message-2' }),
    );

    expect(result.inserted).toBe(false);
    expect(em.findOne).toHaveBeenNthCalledWith(2, CapReceivedEntity, {
      group: 'test-group',
      dedupeKey: 'test-topic|test-group|message-1',
    });
  });

  it('marks processed', async () => {
    const entity = receivedEntity({ processed: false });
    (em.findOne as jest.Mock).mockResolvedValue(entity);

    await storage.markProcessed('test-id');

    expect(entity.processed).toBe(true);
    expect(entity.status).toBe('processed');
    expect(entity.processedAt).toEqual(expect.any(Date));
    expect(entity.nextRetry).toBeUndefined();
    expect(em.flush).toHaveBeenCalled();
  });

  it('marks retryable handler failures', async () => {
    const entity = receivedEntity({ retryCount: 1 });
    (em.findOne as jest.Mock).mockResolvedValue(entity);

    const nextRetry = new Date('2025-01-02');
    await storage.markReceivedFailed('test-id', new Error('handler'), {
      maxRetries: 3,
      nextRetryAt: nextRetry,
      now: new Date('2025-01-01'),
    });

    expect(entity.retryCount).toBe(2);
    expect(entity.status).toBe('failed');
    expect(entity.nextRetry).toEqual(nextRetry);
    expect(entity.lastError).toBe('handler');
    expect(em.flush).toHaveBeenCalled();
  });

  it('dead-letters handler failures when max retries is reached', async () => {
    const entity = receivedEntity({ retryCount: 2 });
    (em.findOne as jest.Mock).mockResolvedValue(entity);

    await storage.markReceivedFailed('test-id', 'boom', {
      maxRetries: 3,
      nextRetryAt: new Date('2025-01-02'),
      now: new Date('2025-01-01'),
    });

    expect(entity.retryCount).toBe(3);
    expect(entity.status).toBe('dead_letter');
    expect(entity.nextRetry).toBeUndefined();
    expect(entity.lastError).toBe('boom');
  });

  it('returns retry-due events', async () => {
    const entity = receivedEntity({
      processed: false,
      status: 'failed',
      retryCount: 1,
      nextRetry: new Date('2000-01-01'),
    });
    (em.find as jest.Mock).mockResolvedValue([entity]);

    const result = await storage.getRetryDue(10);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'test-id',
      topic: 'test-topic',
      group: 'test-group',
      messageId: 'message-1',
    });
  });

  it('finds and lists received events for dashboard helpers', async () => {
    const entity = receivedEntity();
    (em.findOne as jest.Mock).mockResolvedValue(entity);
    (em.findAndCount as jest.Mock).mockResolvedValue([[entity], 1]);

    await expect(storage.findReceivedById('test-id')).resolves.toMatchObject({
      id: 'test-id',
      topic: 'test-topic',
      group: 'test-group',
      messageId: 'message-1',
    });

    const result = await storage.listReceived({
      limit: 10,
      offset: 0,
      topic: 'test-topic',
      due: true,
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(em.findAndCount).toHaveBeenCalledWith(
      CapReceivedEntity,
      expect.objectContaining({
        topic: 'test-topic',
        status: 'failed',
        nextRetry: expect.any(Object),
      }),
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });
});

function receivedEvent(
  overrides: Partial<CapReceivedEvent> = {},
): CapReceivedEvent {
  return {
    id: 'test-id',
    topic: 'test-topic',
    occurredAt: new Date().toISOString(),
    group: 'test-group',
    messageId: 'message-1',
    dedupeKey: 'test-topic|test-group|message-1',
    payload: { foo: 'bar' },
    headers: { 'x-trace': '123' },
    processed: false,
    retryCount: 0,
    status: 'pending',
    nextRetry: new Date(),
    ...overrides,
  };
}

function receivedEntity(
  overrides: Partial<CapReceivedEntity> = {},
): CapReceivedEntity {
  const entity = new CapReceivedEntity();
  entity.id = 'test-id';
  entity.topic = 'test-topic';
  entity.group = 'test-group';
  entity.messageId = 'message-1';
  entity.dedupeKey = 'test-topic|test-group|message-1';
  entity.payload = { foo: 'bar' };
  entity.headers = {};
  entity.processed = false;
  entity.retryCount = 0;
  entity.status = 'pending';
  entity.createdAt = new Date();
  Object.assign(entity, overrides);
  return entity;
}
