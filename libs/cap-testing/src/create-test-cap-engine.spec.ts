import {
  createPublishFixture,
  createReceivedFixture,
  createTestCapEngine,
} from './index';

describe('createTestCapEngine', () => {
  it('creates a usable in-memory CAP engine', async () => {
    let id = 0;
    const cap = createTestCapEngine({
      idGenerator: () => `id-${++id}`,
      now: () => new Date('2026-06-16T00:00:00.000Z'),
    });

    await cap.engine.publish('test.topic', { ok: true });

    expect(cap.publisher.emitted).toEqual([
      expect.objectContaining({
        topic: 'test.topic',
        payload: { ok: true },
        metadata: { messageId: 'id-1' },
      }),
    ]);
    await expect(cap.publishStorage.findPublishById('id-1')).resolves.toEqual(
      expect.objectContaining({ status: 'published' }),
    );
  });

  it('creates message fixtures with predictable defaults', () => {
    expect(createPublishFixture()).toEqual(
      expect.objectContaining({
        id: 'publish-1',
        topic: 'test.topic',
        status: 'pending',
      }),
    );
    expect(createReceivedFixture()).toEqual(
      expect.objectContaining({
        id: 'received-1',
        dedupeKey: 'test.topic|test-group|message-1',
        processed: false,
      }),
    );
  });
});
