import { CapMicroservicesBridge } from './cap-microservices-bridge';

describe('CapMicroservicesBridge', () => {
  it('dispatches messages to registered CAP subscribers', async () => {
    const bridge = new CapMicroservicesBridge();
    const handler = jest.fn().mockResolvedValue(undefined);

    await bridge.consume('user.created', 'workers', handler);
    await bridge.dispatch('user.created', 'workers', {
      payload: { id: 1 },
      headers: { traceId: 'abc' },
    });

    expect(handler).toHaveBeenCalledWith(
      { id: 1 },
      { traceId: 'abc' },
      undefined,
    );
  });

  it('ignores groups without registered handlers', async () => {
    const bridge = new CapMicroservicesBridge();

    await expect(
      bridge.dispatch('user.created', 'missing', { id: 1 }),
    ).resolves.toBeUndefined();
  });
});
