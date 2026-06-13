/* eslint-disable @typescript-eslint/unbound-method */

import { Test } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { MikroPublishStorage } from './mikro-publish-storage';
import { CapPublishEntity } from '../entities/cap-publish.entity';
import { type CapPublishEvent } from '@cap/cap-nest';

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

  describe('savePublish', () => {
    it('should persist a publish event', async () => {
      const event: CapPublishEvent = {
        id: 'test-id',
        topic: 'test-topic',
        occurredAt: new Date().toISOString(),
        payload: { foo: 'bar' },
        headers: { 'x-trace': '123' },
        retryCount: 0,
      };

      await storage.savePublish(event);

      expect(em.persistAndFlush).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          topic: 'test-topic',
          payload: { foo: 'bar' },
          headers: { 'x-trace': '123' },
          retryCount: 0,
        }),
      );
    });
  });

  describe('markPublished', () => {
    it('should update status to published and flush', async () => {
      const entity = new CapPublishEntity();
      entity.id = 'test-id';
      entity.status = 'published';

      (em.findOne as jest.Mock).mockResolvedValue(entity);

      await storage.markPublished('test-id');

      expect(entity.status).toBe('published');
      expect(em.flush).toHaveBeenCalled();
    });

    it('should do nothing if event not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      await storage.markPublished('missing-id');

      expect(em.flush).not.toHaveBeenCalled();
    });
  });

  describe('getUnpublished', () => {
    it('should return pending events', async () => {
      const entity = new CapPublishEntity();
      entity.id = 'test-id';
      entity.topic = 'test-topic';
      entity.payload = { foo: 'bar' };
      entity.headers = {};
      entity.status = 'published';
      entity.retryCount = 0;
      entity.createdAt = new Date();

      (em.find as jest.Mock).mockResolvedValue([entity]);

      const result = await storage.getUnpublished(10);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'test-id',
        topic: 'test-topic',
        payload: { foo: 'bar' },
        retryCount: 0,
      });
    });
  });

  describe('dashboard helpers', () => {
    it('should find a publish event by id', async () => {
      const entity = new CapPublishEntity();
      entity.id = 'test-id';
      entity.topic = 'test-topic';
      entity.payload = { foo: 'bar' };
      entity.headers = {};
      entity.retryCount = 0;
      entity.createdAt = new Date();

      (em.findOne as jest.Mock).mockResolvedValue(entity);

      const result = await storage.findPublishById('test-id');

      expect(result).toMatchObject({
        id: 'test-id',
        topic: 'test-topic',
        payload: { foo: 'bar' },
      });
    });

    it('should list publish events with filters', async () => {
      const entity = new CapPublishEntity();
      entity.id = 'test-id';
      entity.topic = 'test-topic';
      entity.payload = { foo: 'bar' };
      entity.headers = {};
      entity.retryCount = 0;
      entity.createdAt = new Date();

      (em.findAndCount as jest.Mock).mockResolvedValue([[entity], 1]);

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
});
