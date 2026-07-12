import {
  CapMicroservicesBridge,
  __resetLegacyNestjsWrapperWarningForTest,
} from './cap-microservices-bridge';
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
    // Business object with payload + headers but NO metadata: passes through
    // to core's legacy decoder (not unwrapped as a NestJS wrapper).
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

  describe('legacy NestJS wrapper compatibility', () => {
    let bridge: CapMicroservicesBridge;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      __resetLegacyNestjsWrapperWarningForTest();
      bridge = new CapMicroservicesBridge();
      consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('unwraps old publisher { payload, headers, metadata } shape', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      await bridge.dispatch('orders', 'workers', {
        payload: { orderId: 'old-pub' },
        headers: { traceId: 'legacy-trace' },
        metadata: { messageId: 'legacy-msg-id' },
      });

      expect(handler).toHaveBeenCalledWith(
        { orderId: 'old-pub' },
        { traceId: 'legacy-trace' },
        { messageId: 'legacy-msg-id' },
      );
    });

    it('unwraps old publisher { payload, metadata } shape without headers', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      await bridge.dispatch('orders', 'workers', {
        payload: { orderId: 'old-pub' },
        metadata: { messageId: 'legacy-msg-id', dedupeKey: 'dk-1' },
      });

      expect(handler).toHaveBeenCalledWith({ orderId: 'old-pub' }, undefined, {
        messageId: 'legacy-msg-id',
        dedupeKey: 'dk-1',
      });
    });

    it('merges transport headers over nested wrapper headers', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      await bridge.dispatch(
        'orders',
        'workers',
        {
          payload: { orderId: 'old-pub' },
          headers: { traceId: 'wrapper-trace', source: 'wrapper' },
          metadata: { messageId: 'wrapper-id' },
        },
        { traceId: 'transport-trace', broker: 'transport' },
      );

      expect(handler).toHaveBeenCalledWith(
        { orderId: 'old-pub' },
        {
          traceId: 'transport-trace',
          source: 'wrapper',
          broker: 'transport',
        },
        { messageId: 'wrapper-id' },
      );
    });

    it('transport metadata takes precedence over wrapper metadata', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      await bridge.dispatch(
        'orders',
        'workers',
        {
          payload: { orderId: 'old-pub' },
          metadata: { messageId: 'wrapper-id', dedupeKey: 'wrapper-dk' },
        },
        undefined,
        { messageId: 'transport-id', dedupeKey: 'transport-dk' },
      );

      expect(handler).toHaveBeenCalledWith({ orderId: 'old-pub' }, undefined, {
        messageId: 'transport-id',
        dedupeKey: 'transport-dk',
      });
    });

    it('warns once for legacy wrapper', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      await bridge.dispatch('orders', 'workers', {
        payload: { id: 1 },
        metadata: { messageId: 'id-1' },
      });
      await bridge.dispatch('orders', 'workers', {
        payload: { id: 2 },
        metadata: { messageId: 'id-2' },
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][0]).toContain(
        'legacy { payload, headers, metadata }',
      );
    });

    it('does not unwrap business object with payload and headers but no metadata', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      // This is a core legacy envelope, not a NestJS wrapper
      const businessObj = {
        payload: { value: 123 },
        headers: { traceId: 'business' },
      };
      await bridge.dispatch('orders', 'workers', businessObj);

      expect(handler).toHaveBeenCalledWith(businessObj, undefined, undefined);
    });

    it('does not unwrap ordinary business object with payload and extra keys', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      const businessObj = {
        payload: { value: 123 },
        source: 'external',
        type: 'measurement',
      };
      await bridge.dispatch('orders', 'workers', businessObj);

      expect(handler).toHaveBeenCalledWith(businessObj, undefined, undefined);
    });

    it('does not unwrap a raw string payload', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      await bridge.dispatch('orders', 'workers', 'just a string');

      expect(handler).toHaveBeenCalledWith(
        'just a string',
        undefined,
        undefined,
      );
    });

    it('new publisher CAP envelope passes through unchanged', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      const envelope = createCapMessageEnvelope(
        { orderId: 'o1' },
        { 'cap-message-id': 'envelope-id' },
      );
      await bridge.dispatch('orders', 'workers', envelope);

      // Bridge does not unwrap CAP envelopes; core's decodeCapMessage handles them
      expect(handler).toHaveBeenCalledWith(envelope, undefined, undefined);
    });

    it('rejects a wrapper with non-plain metadata', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      const wrapperWithDateMetadata = {
        payload: { id: 1 },
        metadata: new Date(),
      };
      await bridge.dispatch('orders', 'workers', wrapperWithDateMetadata);

      // Not recognized as legacy wrapper; passes through as-is
      expect(handler).toHaveBeenCalledWith(
        wrapperWithDateMetadata,
        undefined,
        undefined,
      );
    });

    it('rejects a wrapper with extra unknown keys', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await bridge.consume('orders', 'workers', handler);

      const wrapperWithExtra = {
        payload: { id: 1 },
        headers: { traceId: 'abc' },
        metadata: { messageId: 'mid' },
        extra: 'should-not-be-here',
      };
      await bridge.dispatch('orders', 'workers', wrapperWithExtra);

      // Extra key disqualifies it from legacy wrapper detection
      expect(handler).toHaveBeenCalledWith(
        wrapperWithExtra,
        undefined,
        undefined,
      );
    });
  });
});
