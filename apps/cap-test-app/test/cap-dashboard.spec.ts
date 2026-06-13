import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CapTestAppModule } from './../src/cap-test-app.module';

describe('Cap Dashboard API', () => {
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

  it('lists messages produced by the demo publish endpoint', async () => {
    await request(app.getHttpServer())
      .post('/demo/publish?msg=spec')
      .expect(201);

    const outbox = await request(app.getHttpServer())
      .get('/api/cap/outbox?page=1&limit=20&topic=example.topic')
      .expect(200);

    expect(outbox.body.items).toHaveLength(1);
    expect(outbox.body.items[0]).toMatchObject({
      topic: 'example.topic',
      status: 'published',
    });

    const inbox = await request(app.getHttpServer())
      .get('/api/cap/inbox?page=1&limit=20&topic=example.topic')
      .expect(200);

    expect(inbox.body.items).toHaveLength(1);
    expect(inbox.body.items[0]).toMatchObject({
      topic: 'example.topic',
      processed: true,
    });
  });
});
