/* eslint-disable @typescript-eslint/unbound-method */

import { Test } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { MikroPublishStorage } from './mikro-publish-storage';
import { CapPublishEntity } from '../entities/cap-publish.entity';
import { type CapPublishEvent } from '@mikara89/cap-nest';

describe('MikroPublishStorage', () => {
  let storage: MikroPublishStorage;
  let em: EntityManager;

  beforeEach(async () => {
    const mockEm = {
      create: jest.fn((_, data) => ({ ...data, id: data.id })),
      persistAndFlush: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      flush: jest.fn(),
      transactional: jest.fn(async (fn) => fn(mockEm)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MikroPublishStorage,
        { provide: EntityManager, useValue: mockEm },
      ],
    }).compile();

    storage = moduleRef.get(MikroPublishStorage);
    em = moduleRef.get(EntityManager);
  });

  it('persists a publish event with pending status', async () => {
    const event: CapPublishEvent = {
      id: 'test-id',
      topic: 'test-topic',
      occurredAt: new Date().toISOString(),
      payload: { foo: 'bar' },
      headers: { 'x-trace': '123' },
      retryCount: 0,
      status: 'pending',
    };

    await storage.savePublish(event);

    expect(em.persistAndFlush).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-id',
        topic: 'test-topic',
        payload: { foo: 'bar' },
        headers: { 'x-trace': '123' },
        retryCount: 0,
        status: 'pending',
      }),
    );
  });

  it('claims ready events by marking them processing with a lease', async () => {
    const entity = publishEntity({ status: 'pending' });
    (em.find as jest.Mock).mockResolvedValue([entity]);

    const lockUntil = new Date(Date.now() + 30_000);
    const result = await storage.claimUnpublished({
      limit: 10,
      lockedBy: 'worker-1',
      lockUntil,
      now: new Date(),
    });

    expect(entity.status).toBe('processing');
    expect(entity.lockedBy).toBe('worker-1');
    expect(entity.lockedUntil).toBe(lockUntil);
    expect(em.flush).toHaveBeenCalled();
    expect(result[0]).toMatchObject({ id: 'test-id', status: 'processing' });
  });

  it('marks published and clears lease fields', async () => {
    const entity = publishEntity({ status: 'processing' });
    entity.lockedBy = 'worker';
    entity.lockedUntil = new Date();
    (em.findOne as jest.Mock).mockResolvedValue(entity);

    await storage.markPublished('test-id');

    expect(entity.status).toBe('published');
    expect(entity.publishedAt).toEqual(expect.any(Date));
    expect(entity.lockedBy).toBeNull();
    expect(entity.lockedUntil).toBeNull();
    expect(em.flush).toHaveBeenCalled();
  });

  it('marks retryable publish failures', async () => {
    const entity = publishEntity({ status: 'processing', retryCount: 0 });
    (em.findOne as jest.Mock).mockResolvedValue(entity);

    const nextRetryAt = new Date(Date.now() + 1000);
    await storage.markPublishFailed('test-id', new Error('net'), {
      maxRetries: 3,
      nextRetryAt,
      now: new Date(),
    });

    expect(entity.status).toBe('failed');
    expect(entity.retryCount).toBe(1);
    expect(entity.nextRetryAt).toBe(nextRetryAt);
    expect(entity.lastError).toBe('net');
    expect(em.flush).toHaveBeenCalled();
  });

  it('dead-letters when max retries is reached', async () => {
    const entity = publishEntity({ status: 'processing', retryCount: 2 });
    (em.findOne as jest.Mock).mockResolvedValue(entity);

    await storage.markPublishFailed('test-id', 'boom', {
      maxRetries: 3,
      nextRetryAt: new Date(),
      now: new Date(),
    });

    expect(entity.status).toBe('dead_letter');
    expect(entity.retryCount).toBe(3);
    expect(entity.nextRetryAt).toBeNull();
  });

  it('releases expired claims', async () => {
    const entity = publishEntity({ status: 'processing' });
    entity.lockedBy = 'worker';
    entity.lockedUntil = new Date('2000-01-01');
    (em.find as jest.Mock).mockResolvedValue([entity]);

    await storage.releaseExpiredClaims(new Date());

    expect(entity.status).toBe('failed');
    expect(entity.lockedBy).toBeNull();
    expect(entity.lockedUntil).toBeNull();
    expect(em.flush).toHaveBeenCalled();
  });

  it('finds and lists publish events for dashboard helpers', async () => {
    const entity = publishEntity({ status: 'pending' });
    (em.findOne as jest.Mock).mockResolvedValue(entity);
    (em.findAndCount as jest.Mock).mockResolvedValue([[entity], 1]);

    await expect(storage.findPublishById('test-id')).resolves.toMatchObject({
      id: 'test-id',
      topic: 'test-topic',
    });

    const result = await storage.listPublish({
      limit: 10,
      offset: 0,
      topic: 'test-topic',
      onlyUnpublished: true,
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(em.findAndCount).toHaveBeenCalledWith(
      CapPublishEntity,
      expect.objectContaining({
        topic: 'test-topic',
        $or: expect.any(Array),
      }),
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });
});

function publishEntity(
  overrides: Partial<CapPublishEntity> = {},
): CapPublishEntity {
  const entity = new CapPublishEntity();
  entity.id = 'test-id';
  entity.topic = 'test-topic';
  entity.payload = { foo: 'bar' };
  entity.headers = {};
  entity.retryCount = 0;
  entity.status = 'pending';
  entity.createdAt = new Date();
  Object.assign(entity, overrides);
  return entity;
}
