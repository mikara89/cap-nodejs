import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CapTestAppModule } from './../src/cap-test-app.module';

describe('Cap Dashboard API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CapTestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('shows publish flow through dashboard outbox and inbox APIs', async () => {
    await request(app.getHttpServer())
      .post('/demo/publish?msg=dashboard-flow')
      .expect(201);

    const outbox = await request(app.getHttpServer())
      .get('/api/cap/outbox?page=1&limit=20&topic=example.topic')
      .expect(200);

    expect(outbox.body.items).toHaveLength(1);
    const outboxId = outbox.body.items[0].id;

    const outboxDetail = await request(app.getHttpServer())
      .get(`/api/cap/outbox/${outboxId}?full=true`)
      .expect(200);

    expect(outboxDetail.body).toMatchObject({
      id: outboxId,
      topic: 'example.topic',
      status: 'published',
    });
    expect(outboxDetail.body.payload).toMatchObject({
      text: 'dashboard-flow',
    });

    const inbox = await request(app.getHttpServer())
      .get('/api/cap/inbox?page=1&limit=20&topic=example.topic')
      .expect(200);

    expect(inbox.body.items).toHaveLength(1);
    const inboxId = inbox.body.items[0].id;

    const inboxDetail = await request(app.getHttpServer())
      .get(`/api/cap/inbox/${inboxId}?full=true`)
      .expect(200);

    expect(inboxDetail.body).toMatchObject({
      id: inboxId,
      topic: 'example.topic',
      processed: true,
    });
  });

  it('supports dashboard admin actions for retry, mark, and flush', async () => {
    await request(app.getHttpServer())
      .post('/demo/fail-next-handler')
      .expect(201);

    await request(app.getHttpServer())
      .post('/demo/publish?msg=dashboard-actions')
      .expect(201);

    const inbox = await request(app.getHttpServer())
      .get('/api/cap/inbox?page=1&limit=20&topic=example.topic')
      .expect(200);

    const inboxId = inbox.body.items[0].id;

    await request(app.getHttpServer())
      .post(`/api/cap/inbox/${inboxId}/retry`)
      .send({ force: false })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });

    await request(app.getHttpServer())
      .post(`/api/cap/inbox/${inboxId}/mark-processed`)
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });

    const outbox = await request(app.getHttpServer())
      .get('/api/cap/outbox?page=1&limit=20&topic=example.topic')
      .expect(200);

    const outboxId = outbox.body.items[0].id;

    await request(app.getHttpServer())
      .post(`/api/cap/outbox/${outboxId}/mark-published`)
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });

    await request(app.getHttpServer())
      .post('/api/cap/scheduler/flush-outbox')
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
  });
});
