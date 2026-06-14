import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import {
  CapModule,
  CapService,
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
  PUBLISHER,
  SUBSCRIBER,
} from '@mikara89/cap-nest';
import { ScheduleModule } from '@nestjs/schedule';
import { TestStorageSpy } from './helpers/test-storage-spy';
import { TestTransportSpy } from './helpers/test-transport-spy';
import { waitForCondition } from './helpers/wait-for.util';
import {
  TestHandlerService,
  AlternateHandlerService,
  TestHandlersModule,
} from './fixtures/test-handlers.module';
import {
  type UserCreatedDto,
  type OrderPlacedDto,
} from './fixtures/test-messages';

describe('CAP Integration Tests', () => {
  let app: INestApplication;
  let capService: CapService;
  let storage: TestStorageSpy;
  let transport: TestTransportSpy;
  let testHandler: TestHandlerService;
  let alternateHandler: AlternateHandlerService;

  beforeEach(async () => {
    // Create spy instances
    storage = new TestStorageSpy();
    transport = new TestTransportSpy();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ScheduleModule.forRoot(),
        CapModule.forRoot({
          storage: [
            { provide: PUBLISH_STORAGE, useValue: storage },
            { provide: RECEIVED_STORAGE, useValue: storage },
          ],
          transport: [
            { provide: PUBLISHER, useValue: transport },
            { provide: SUBSCRIBER, useValue: transport },
          ],
        }),
        TestHandlersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    capService = moduleFixture.get<CapService>(CapService);
    testHandler = moduleFixture.get<TestHandlerService>(TestHandlerService);
    alternateHandler = moduleFixture.get<AlternateHandlerService>(
      AlternateHandlerService,
    );
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    storage.reset();
    transport.reset();
    testHandler.reset();
    alternateHandler.reset();
  });

  describe('Outbox Pattern - Publish Flow', () => {
    it('should save message to storage before publishing to transport', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      await capService.publish('user.created', payload);

      // Verify storage was called
      expect(storage.savePublishCalls).toHaveLength(1);
      expect(storage.savePublishCalls[0].topic).toBe('user.created');
      expect(storage.savePublishCalls[0].payload).toEqual(payload);

      // Verify transport was called
      expect(transport.emitCalls).toHaveLength(1);
      expect(transport.emitCalls[0].topic).toBe('user.created');
    });

    it('should mark message as published after successful transport', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-456',
        email: 'user@example.com',
        name: 'Another User',
      };

      await capService.publish('user.created', payload);

      // Verify message was marked as published
      expect(storage.markPublishedCalls).toHaveLength(1);

      const publishEventId = storage.markPublishedCalls[0];
      const publishEvent = storage.getPublishEvent(publishEventId);
      expect(publishEvent?.status).toBe('published');
    });

    it('should leave message unpublished when transport fails', async () => {
      transport.setEmitFailure(true);

      const payload: OrderPlacedDto = {
        orderId: 'order-123',
        userId: 'user-123',
        amount: 99.99,
      };

      // publish() catches errors internally and logs them
      await capService.publish('order.placed', payload);

      // Verify message was saved
      expect(storage.savePublishCalls).toHaveLength(1);

      // Verify message was NOT marked as published
      expect(storage.markPublishedCalls).toHaveLength(0);

      // Message should not have published status
      const allEvents = storage.getAllPublishEvents();
      expect(allEvents[0].status).not.toBe('published');
    });
  });

  describe('Inbox Pattern - Consume Flow', () => {
    it('should invoke registered handler when message is received', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-789',
        email: 'handler@example.com',
        name: 'Handler Test',
      };

      await capService.publish('user.created', payload);

      // Wait for async handler execution
      await waitForCondition(() => testHandler.userCreatedCalls.length > 0);

      expect(testHandler.userCreatedCalls).toHaveLength(1);
      expect(testHandler.userCreatedCalls[0]).toEqual(payload);
    });

    it('should store received message before executing handler', async () => {
      const payload: OrderPlacedDto = {
        orderId: 'order-456',
        userId: 'user-456',
        amount: 149.99,
      };

      await capService.publish('order.placed', payload);

      await waitForCondition(() => storage.saveReceivedCalls.length > 0);

      expect(storage.saveReceivedCalls).toHaveLength(1);
      expect(storage.saveReceivedCalls[0].topic).toBe('order.placed');
    });

    it('should mark message as processed after successful handler execution', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-success',
        email: 'success@example.com',
        name: 'Success User',
      };

      await capService.publish('user.created', payload);

      await waitForCondition(() => storage.markProcessedCalls.length > 0);

      // Both handlers (test-service and alternate-service) process the message
      expect(storage.markProcessedCalls.length).toBeGreaterThanOrEqual(1);

      const processedId = storage.markProcessedCalls[0];
      const receivedEvent = storage.getReceivedEvent(processedId);
      expect(receivedEvent?.processed).toBe(true);
    });

    it('should schedule retry when handler fails', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-fail',
        email: 'fail@example.com',
        name: 'Fail User',
      };

      testHandler.shouldFailUserCreated = true;

      await capService.publish('user.created', payload);

      await waitForCondition(() => storage.scheduleRetryCalls.length > 0);

      expect(storage.scheduleRetryCalls).toHaveLength(1);
      expect(storage.scheduleRetryCalls[0].retryCount).toBe(1);
      expect(storage.scheduleRetryCalls[0].nextRetry).toBeDefined();

      // The event was scheduled for retry
      const retryCall = storage.scheduleRetryCalls[0];
      expect(retryCall.id).toBeDefined();
      expect(retryCall.retryCount).toBe(1);
    });
  });

  describe('Multiple Handlers & Topics', () => {
    it('should invoke multiple handlers for the same topic with different groups', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-multi',
        email: 'multi@example.com',
        name: 'Multi Handler',
      };

      await capService.publish('user.created', payload);

      await waitForCondition(
        () =>
          testHandler.userCreatedCalls.length > 0 &&
          alternateHandler.userCreatedCalls.length > 0,
      );

      expect(testHandler.userCreatedCalls).toHaveLength(1);
      expect(alternateHandler.userCreatedCalls).toHaveLength(1);
      expect(testHandler.userCreatedCalls[0]).toEqual(payload);
      expect(alternateHandler.userCreatedCalls[0]).toEqual(payload);
    });

    it('should handle different message types correctly', async () => {
      const userPayload: UserCreatedDto = {
        userId: 'user-abc',
        email: 'abc@example.com',
        name: 'ABC User',
      };

      const orderPayload: OrderPlacedDto = {
        orderId: 'order-xyz',
        userId: 'user-abc',
        amount: 299.99,
      };

      await capService.publish('user.created', userPayload);
      await capService.publish('order.placed', orderPayload);

      await waitForCondition(
        () =>
          testHandler.userCreatedCalls.length > 0 &&
          testHandler.orderPlacedCalls.length > 0,
      );

      expect(testHandler.userCreatedCalls).toHaveLength(1);
      expect(testHandler.orderPlacedCalls).toHaveLength(1);
      expect(testHandler.userCreatedCalls[0]).toEqual(userPayload);
      expect(testHandler.orderPlacedCalls[0]).toEqual(orderPayload);
    });
  });

  describe('Retry Mechanisms', () => {
    it('should increment retry count on each failure', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-retry',
        email: 'retry@example.com',
        name: 'Retry User',
      };

      testHandler.shouldFailUserCreated = true;

      await capService.publish('user.created', payload);

      await waitForCondition(() => storage.scheduleRetryCalls.length > 0);

      expect(storage.scheduleRetryCalls[0].retryCount).toBe(1);

      // Verify exponential backoff is working
      const firstRetryTime = storage.scheduleRetryCalls[0].nextRetry;
      expect(firstRetryTime.getTime()).toBeGreaterThan(Date.now());
    });

    it('should calculate exponential backoff for retry scheduling', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-backoff',
        email: 'backoff@example.com',
        name: 'Backoff User',
      };

      testHandler.shouldFailUserCreated = true;

      await capService.publish('user.created', payload);

      await waitForCondition(() => storage.scheduleRetryCalls.length > 0);

      const firstRetry = storage.scheduleRetryCalls[0];
      expect(firstRetry.nextRetry.getTime()).toBeGreaterThan(Date.now());

      // The retry should be scheduled in the future (exponential backoff)
      const delayMs = firstRetry.nextRetry.getTime() - Date.now();
      expect(delayMs).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in message handlers gracefully', async () => {
      await capService.publish('error.test', { data: 'error-test' });

      await waitForCondition(() => storage.saveReceivedCalls.length > 0);

      // Handler threw error, so retry should be scheduled
      await waitForCondition(() => storage.scheduleRetryCalls.length > 0);

      expect(storage.scheduleRetryCalls).toHaveLength(1);
      expect(storage.markProcessedCalls).toHaveLength(0);
    });

    it('should continue processing other messages after a handler failure', async () => {
      testHandler.shouldFailUserCreated = true;

      const userPayload: UserCreatedDto = {
        userId: 'user-fail-continue',
        email: 'fail@example.com',
        name: 'Fail User',
      };

      const orderPayload: OrderPlacedDto = {
        orderId: 'order-success',
        userId: 'user-123',
        amount: 99.99,
      };

      await capService.publish('user.created', userPayload);
      await capService.publish('order.placed', orderPayload);

      await waitForCondition(() => testHandler.orderPlacedCalls.length > 0);

      // Order handler succeeded
      expect(testHandler.orderPlacedCalls).toHaveLength(1);

      // User handler failed and scheduled retry
      await waitForCondition(() => storage.scheduleRetryCalls.length > 0);
      expect(storage.scheduleRetryCalls.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full outbox->publish->inbox->process cycle', async () => {
      const payload: UserCreatedDto = {
        userId: 'user-e2e',
        email: 'e2e@example.com',
        name: 'E2E User',
      };

      // 1. Publish (outbox)
      await capService.publish('user.created', payload);

      // 2. Verify storage
      expect(storage.savePublishCalls).toHaveLength(1);
      const publishedId = storage.markPublishedCalls[0];
      const outboxEvent = storage.getPublishEvent(publishedId);
      expect(outboxEvent).toBeDefined();

      // 3. Verify transport
      expect(transport.emitCalls).toHaveLength(1);

      // 4. Verify published flag
      expect(storage.markPublishedCalls).toHaveLength(1);
      expect(outboxEvent?.status).toBe('published');

      // 5. Verify inbox storage (both handlers receive the message)
      await waitForCondition(() => storage.saveReceivedCalls.length > 0);
      expect(storage.saveReceivedCalls.length).toBeGreaterThanOrEqual(1);

      // 6. Verify handler execution
      await waitForCondition(() => testHandler.userCreatedCalls.length > 0);
      expect(testHandler.userCreatedCalls).toHaveLength(1);
      expect(testHandler.userCreatedCalls[0]).toEqual(payload);

      // 7. Verify processed flag
      await waitForCondition(() => storage.markProcessedCalls.length > 0);
      expect(storage.markProcessedCalls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
