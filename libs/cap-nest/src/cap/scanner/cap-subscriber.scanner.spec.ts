import { CapSubscriberScanner } from './cap-subscriber.scanner';
import { CapSubscribe } from '../decorators/cap-subscribe.decorator';
import { ModulesContainer, Reflector } from '@nestjs/core';

describe('CapSubscriberScanner (integration)', () => {
  it('discovers @CapSubscribe methods and calls CapService.subscribe', () => {
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

    const capService = { subscribe: jest.fn() } as unknown as any;

    const scanner = new CapSubscriberScanner(
      modulesContainer,
      reflector,
      capService,
    );

    scanner.onModuleInit();

    expect(capService.subscribe).toHaveBeenCalledWith(
      't.scan',
      'g-scan',
      expect.any(Function),
    );
  });
});
