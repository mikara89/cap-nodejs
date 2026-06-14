import { Test } from '@nestjs/testing';
import { CapModule } from '@mikara89/cap-nest';
import { CapDashboardModule } from '../src/cap-dashboard.module';
import { CapDashboardController } from '../src/cap-dashboard.controller';
import { CapDashboardAssetsController } from '../src/cap-dashboard-assets.controller';
import { CapDashboardService } from '../src/cap-dashboard.service';
import { CapDashboardGuard } from '../src/guards/cap-dashboard.guard';
import { PUBLISH_STORAGE, RECEIVED_STORAGE } from '@mikara89/cap-nest';
import type { IPublishStorage, IReceivedStorage } from '@mikara89/cap-nest';
import type { CapPublishEvent } from '@mikara89/cap-nest';
import type { CapReceivedEvent } from '@mikara89/cap-nest';
import { Reflector } from '@nestjs/core';

describe('CapDashboard integration (in-memory)', () => {
  let moduleRef: any;
  let svc: CapDashboardService;
  let pubStore: IPublishStorage;
  let recStore: IReceivedStorage;

  beforeAll(async () => {
    const mockGuardProvider = {
      provide: 'TEST_GUARD',
      useValue: { canActivate: () => true },
    };

    moduleRef = await Test.createTestingModule({
      imports: [
        CapModule.forInMemory(),
        CapDashboardModule.forRoot({
          guard: mockGuardProvider,
          serveStatic: false,
        }),
      ],
    }).compile();

    svc = moduleRef.get(CapDashboardService);
    pubStore = moduleRef.get(PUBLISH_STORAGE);
    recStore = moduleRef.get(RECEIVED_STORAGE);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('lists and finds outbox records using in-memory helpers', async () => {
    const evt1: CapPublishEvent = {
      id: 'p-1',
      topic: 'user.created',
      occurredAt: new Date().toISOString(),
      payload: { name: 'Alice' },
      headers: { traceId: 'trace-1' },
      retryCount: 0,
    };

    const evt2: CapPublishEvent = {
      id: 'p-2',
      topic: 'order.created',
      occurredAt: new Date().toISOString(),
      payload: { orderId: 123 },
      retryCount: 0,
      status: 'published',
    };

    await pubStore.savePublish(evt1);
    await pubStore.savePublish(evt2);

    const page = await svc.listOutbox({ page: 1, limit: 10 });
    expect(page.items.some((i) => i.id === 'p-1')).toBeTruthy();
    expect(page.items.some((i) => i.id === 'p-2')).toBeTruthy();

    const found = await svc.getOutboxById('p-1', true);
    expect(found).toBeDefined();
    expect(found?.id).toBe('p-1');
    expect(found?.headers).toEqual({ traceId: 'trace-1' });
  });

  it('lists inbox due items and can get by id', async () => {
    const rec: CapReceivedEvent = {
      id: 'r-1',
      topic: 'user.created',
      group: 'default',
      occurredAt: new Date().toISOString(),
      payload: { name: 'Bob' },
      headers: { traceId: 'trace-2' },
      retryCount: 1,
      processed: false,
      nextRetry: new Date(Date.now() - 1000),
    };

    await recStore.saveReceived(rec);

    const page = await svc.listInbox({ page: 1, limit: 10, due: true });
    expect(page.items.length).toBeGreaterThanOrEqual(1);

    const item = await svc.getInboxById('r-1', true);
    expect(item).toBeDefined();
    expect(item?.id).toBe('r-1');
    expect(item?.headers).toEqual({ traceId: 'trace-2' });
  });

  it('retryOutbox emits and marks published', async () => {
    const evt: CapPublishEvent = {
      id: 'p-retry',
      topic: 'test.retry',
      occurredAt: new Date().toISOString(),
      payload: { foo: 'bar' },
      headers: { traceId: 'retry' },
      retryCount: 0,
    };
    await pubStore.savePublish(evt);

    const res = await svc.retryOutbox('p-retry');
    expect(res.success).toBeTruthy();

    const found = await (pubStore as any).findPublishById('p-retry');
    expect(found).toBeDefined();
    expect(found?.status).toBe('published');
  });

  it('retryInbox schedules/executes retry via CapService', async () => {
    const rec: CapReceivedEvent = {
      id: 'r-retry',
      topic: 'no.handler',
      group: 'g1',
      occurredAt: new Date().toISOString(),
      payload: { x: 1 },
      retryCount: 0,
      processed: false,
      nextRetry: null,
    };
    await recStore.saveReceived(rec);

    const res = await svc.retryInbox('r-retry');
    expect(res.success).toBeTruthy();
  });

  it('allows read routes and denies admin routes through the policy hook', async () => {
    const guard = new CapDashboardGuard(
      new Reflector(),
      { canActivate: () => true },
      (context) => context.permission === 'read',
    );

    await expect(
      guard.canActivate(
        createExecutionContext(
          // eslint-disable-next-line @typescript-eslint/unbound-method
          CapDashboardController.prototype.listOutbox,
          CapDashboardController,
        ),
      ),
    ).resolves.toBe(true);

    await expect(
      guard.canActivate(
        createExecutionContext(
          // eslint-disable-next-line @typescript-eslint/unbound-method
          CapDashboardAssetsController.prototype.getIndex,
          CapDashboardAssetsController,
        ),
      ),
    ).resolves.toBe(true);

    await expect(
      guard.canActivate(
        createExecutionContext(
          // eslint-disable-next-line @typescript-eslint/unbound-method
          CapDashboardController.prototype.flushOutbox,
          CapDashboardController,
        ),
      ),
    ).resolves.toBe(false);
  });
});

function createExecutionContext(
  handler: (...args: never[]) => unknown,
  controller: new (...args: never[]) => unknown,
): any {
  const request: Record<string, unknown> = {};
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };
}
