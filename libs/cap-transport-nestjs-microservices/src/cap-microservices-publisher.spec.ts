import { NEVER, of, throwError } from 'rxjs';
import { CapMicroservicesPublisher } from './cap-microservices-publisher';
import type { CapClientProxyLike } from './client-proxy.interface';

describe('CapMicroservicesPublisher', () => {
  it('emits through ClientProxy with payload and headers', async () => {
    const client: jest.Mocked<CapClientProxyLike> = {
      emit: jest.fn().mockReturnValue(of(undefined)),
    };
    const publisher = new CapMicroservicesPublisher(client, {
      clientToken: 'CLIENT',
    });

    await publisher.emit('user.created', { id: 1 }, { traceId: 'abc' });

    expect(client.emit.mock.calls[0]).toEqual([
      'user.created',
      {
        payload: { id: 1 },
        headers: { traceId: 'abc' },
      },
    ]);
  });

  it('uses a pattern factory when provided', async () => {
    const client: jest.Mocked<CapClientProxyLike> = {
      emit: jest.fn().mockReturnValue(of(undefined)),
    };
    const publisher = new CapMicroservicesPublisher(client, {
      clientToken: 'CLIENT',
      patternFactory: (topic) => ({ cmd: topic }),
    });

    await publisher.emit('user.created', { id: 1 });

    expect(client.emit.mock.calls[0]).toEqual([
      { cmd: 'user.created' },
      { id: 1 },
    ]);
  });

  it('propagates ClientProxy emit errors', async () => {
    const client: jest.Mocked<CapClientProxyLike> = {
      emit: jest.fn().mockReturnValue(throwError(() => new Error('send'))),
    };
    const publisher = new CapMicroservicesPublisher(client, {
      clientToken: 'CLIENT',
    });

    await expect(publisher.emit('user.created', {})).rejects.toThrow('send');
  });

  it('times out when emit does not complete', async () => {
    const client: jest.Mocked<CapClientProxyLike> = {
      emit: jest.fn().mockReturnValue(NEVER),
    };
    const publisher = new CapMicroservicesPublisher(client, {
      clientToken: 'CLIENT',
      publishTimeoutMs: 1,
    });

    await expect(publisher.emit('user.created', {})).rejects.toThrow();
  });
});
