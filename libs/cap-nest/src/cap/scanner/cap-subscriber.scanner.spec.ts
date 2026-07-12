import { CapSubscriberScanner } from './cap-subscriber.scanner';
import { CapSubscribe } from '../decorators/cap-subscribe.decorator';
import { CapHeaders } from '../decorators/cap-headers.decorator';
import { ModulesContainer, Reflector } from '@nestjs/core';

describe('CapSubscriberScanner (integration)', () => {
  it('discovers @CapSubscribe methods and calls CapService.registerSubscription', () => {
    // create a test class with decorated method
    class ProviderWithHandler {
      @CapSubscribe({ topic: 't.scan', group: 'g-scan' })
      onMessage(): Promise<void> {
        return Promise.resolve();
      }
    }

    const inst = new ProviderWithHandler();

    // fake ModulesContainer: Map with one module value containing providers Map
    const providersMap: Map<string, { instance: object }> = new Map();
    providersMap.set('pw', { instance: inst });

    const modulesContainer = new Map() as unknown as ModulesContainer;
    modulesContainer.set('mod', { providers: providersMap as any } as any);

    const reflector = new Reflector();

    const capService = { registerSubscription: jest.fn() } as unknown as any;

    const scanner = new CapSubscriberScanner(
      modulesContainer,
      reflector,
      capService,
    );

    scanner.onModuleInit();

    expect(capService.registerSubscription).toHaveBeenCalledWith(
      't.scan',
      'g-scan',
      expect.any(Function),
    );
  });

  it('injects headers into @CapHeaders parameter when invoking scanned handlers', async () => {
    const seen: unknown[] = [];

    class ProviderWithHeaders {
      @CapSubscribe({ topic: 't.headers', group: 'g-headers' })
      onMessage(payload: unknown, @CapHeaders() headers: unknown): void {
        seen.push(payload, headers);
      }
    }

    const providersMap: Map<string, { instance: object }> = new Map();
    providersMap.set('ph', { instance: new ProviderWithHeaders() });

    const modulesContainer = new Map() as unknown as ModulesContainer;
    modulesContainer.set('mod', { providers: providersMap as any } as any);

    const capService = { registerSubscription: jest.fn() } as unknown as any;
    const scanner = new CapSubscriberScanner(
      modulesContainer,
      new Reflector(),
      capService,
    );

    scanner.onModuleInit();

    const handler = (capService.registerSubscription as jest.Mock).mock
      .calls[0][2] as (
      payload: unknown,
      headers?: Record<string, unknown>,
    ) => Promise<void>;

    await handler({ id: 1 }, { traceId: 'abc' });

    expect(seen).toEqual([{ id: 1 }, { traceId: 'abc' }]);
  });
});
