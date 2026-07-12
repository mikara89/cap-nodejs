import { CapMicroservicesBridge } from './cap-microservices-bridge';
import {
  CapEngine,
  FakePublisher,
  InMemoryPublishStorage,
  InMemoryReceivedStorage,
  createCapMessageEnvelope,
} from '@mikara89/cap-core';

describe('CapMicroservicesBridge', () => {
  it('preserves ordinary messages containing payload for core decoding', async () => {
    const bridge = new CapMicroservicesBridge();
    const handler = jest.fn().mockResolvedValue(undefined);

    await bridge.consume('user.created', 'workers', handler);
    await bridge.dispatch('user.created', 'workers', {
      payload: { id: 1 },
      headers: { traceId: 'abc' },
    });

    expect(handler).toHaveBeenCalledWith(
      {
        payload: { id: 1 },
        headers: { traceId: 'abc' },
      },
      undefined,
      undefined,
    );
  });

  it('ignores groups without registered handlers', async () => {
    const bridge = new CapMicroservicesBridge();

    await expect(
      bridge.dispatch('user.created', 'missing', { id: 1 }),
    ).resolves.toBeUndefined();
  });

  it('integrates with core decoding while preserving business shape and identity', async () => {
    const bridge = new CapMicroservicesBridge();
    const receivedStorage = new InMemoryReceivedStorage();
    let id = 0;
    const engine = new CapEngine({
      publishStorage: new InMemoryPublishStorage(),
      receivedStorage,
      publisher: new FakePublisher(),
      subscriber: bridge,
      idGenerator: () => `received-${++id}`,
    });
    const handler = jest.fn();
    engine.registerSubscription('orders', 'workers', handler);
    await engine.startSubscriptions();

    await bridge.dispatch(
      'orders',
      'workers',
      createCapMessageEnvelope(
        { orderId: 'o1' },
        { 'cap-message-id': 'envelope-id', source: 'nest-bridge' },
      ),
    );
    const businessPayload = {
      payload: { value: 123 },
      source: 'external-system',
      type: 'measurement',
    };
    await bridge.dispatch('orders', 'workers', businessPayload, undefined, {
      messageId: 'native-id',
    });

    expect(handler).toHaveBeenNthCalledWith(
      1,
      { orderId: 'o1' },
      { 'cap-message-id': 'envelope-id', source: 'nest-bridge' },
    );
    expect(handler).toHaveBeenNthCalledWith(2, businessPayload, undefined);
    expect([...receivedStorage.store.values()]).toEqual([
      expect.objectContaining({
        messageId: 'envelope-id',
        payload: { orderId: 'o1' },
      }),
      expect.objectContaining({
        messageId: 'native-id',
        payload: businessPayload,
      }),
    ]);
  });
});
