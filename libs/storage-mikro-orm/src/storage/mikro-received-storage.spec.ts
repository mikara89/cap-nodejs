/* eslint-disable @typescript-eslint/unbound-method */

import { Test } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { MikroReceivedStorage } from './mikro-received-storage';
import { CapReceivedEntity } from '../entities/cap-received.entity';
import { type CapReceivedEvent } from '@cap/cap-nest';

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

  describe('saveReceived', () => {
    it('should persist a received event', async () => {
      const event: CapReceivedEvent = {
        id: 'test-id',
        topic: 'test-topic',
        occurredAt: new Date().toISOString(),
        group: 'test-group',
        payload: { foo: 'bar' },
        headers: { 'x-trace': '123' },
        processed: false,
        retryCount: 0,
        nextRetry: new Date(),
      };

      await storage.saveReceived(event);

      expect(em.persistAndFlush).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          topic: 'test-topic',
          group: 'test-group',
          payload: { foo: 'bar' },
          headers: { 'x-trace': '123' },
          processed: false,
          retryCount: 0,
        }),
      );
    });
  });

  describe('markProcessed', () => {
    it('should update processed flag and flush', async () => {
      const entity = new CapReceivedEntity();
      entity.id = 'test-id';
      entity.processed = false;

      (em.findOne as jest.Mock).mockResolvedValue(entity);

      await storage.markProcessed('test-id');

      expect(entity.processed).toBe(true);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should do nothing if event not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      await storage.markProcessed('missing-id');

      expect(em.flush).not.toHaveBeenCalled();
    });
  });

  describe('scheduleRetry', () => {
    it('should increment retry count and update nextRetry', async () => {
      const entity = new CapReceivedEntity();
      entity.id = 'test-id';
      entity.retryCount = 1;
      entity.nextRetry = new Date('2025-01-01');

      (em.findOne as jest.Mock).mockResolvedValue(entity);

      const nextRetry = new Date('2025-01-02');
      await storage.scheduleRetry('test-id', 2, nextRetry);

      expect(entity.retryCount).toBe(2);
      expect(entity.nextRetry).toEqual(nextRetry);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should do nothing if event not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      await storage.scheduleRetry('missing-id', 1, new Date());

      expect(em.flush).not.toHaveBeenCalled();
    });
  });

  describe('getRetryDue', () => {
    it('should return unprocessed events with nextRetry in the past', async () => {
      const entity = new CapReceivedEntity();
      entity.id = 'test-id';
      entity.topic = 'test-topic';
      entity.group = 'test-group';
      entity.payload = { foo: 'bar' };
      entity.headers = {};
      entity.processed = false;
      entity.retryCount = 1;
      entity.nextRetry = new Date('2000-01-01');
      entity.createdAt = new Date();

      (em.find as jest.Mock).mockResolvedValue([entity]);

      const result = await storage.getRetryDue(10);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'test-id',
        topic: 'test-topic',
        group: 'test-group',
        payload: { foo: 'bar' },
        processed: false,
        retryCount: 1,
      });
    });
  });

  describe('dashboard helpers', () => {
    it('should find a received event by id', async () => {
      const entity = new CapReceivedEntity();
      entity.id = 'test-id';
      entity.topic = 'test-topic';
      entity.group = 'test-group';
      entity.payload = { foo: 'bar' };
      entity.headers = {};
      entity.processed = false;
      entity.retryCount = 0;
      entity.createdAt = new Date();

      (em.findOne as jest.Mock).mockResolvedValue(entity);

      const result = await storage.findReceivedById('test-id');

      expect(result).toMatchObject({
        id: 'test-id',
        topic: 'test-topic',
        group: 'test-group',
      });
    });

    it('should list received events with filters', async () => {
      const entity = new CapReceivedEntity();
      entity.id = 'test-id';
      entity.topic = 'test-topic';
      entity.group = 'test-group';
      entity.payload = { foo: 'bar' };
      entity.headers = {};
      entity.processed = false;
      entity.retryCount = 0;
      entity.nextRetry = new Date('2000-01-01');
      entity.createdAt = new Date();

      (em.findAndCount as jest.Mock).mockResolvedValue([[entity], 1]);

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
          processed: false,
          nextRetry: expect.any(Object),
        }),
        expect.objectContaining({ limit: 10, offset: 0 }),
      );
    });
  });
});
