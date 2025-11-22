import { CapModule } from './cap.module';
import { PUBLISHER, SUBSCRIBER } from './abstractions/transport.interface';
import {
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
} from './abstractions/storage.interface';

describe('CapModule initialization', () => {
  it('calls initialize() on adapters when init options provided', async () => {
    const initOptions = { createSchema: true, createQueues: true };

    const pubStorage = {
      initialize: jest.fn(async (_: unknown) => Promise.resolve()),
    };
    const recStorage = {
      initialize: jest.fn(async (_: unknown) => Promise.resolve()),
    };
    const publisher = {
      initialize: jest.fn(async (_: unknown) => Promise.resolve()),
    };
    const subscriber = {
      initialize: jest.fn(async (_: unknown) => Promise.resolve()),
    };

    const storageProviders = [
      { provide: PUBLISH_STORAGE, useValue: pubStorage },
      { provide: RECEIVED_STORAGE, useValue: recStorage },
    ];

    const transportProviders = [
      { provide: PUBLISHER, useValue: publisher },
      { provide: SUBSCRIBER, useValue: subscriber },
    ];

    const dm = CapModule.forRoot({
      storage: storageProviders,
      transport: transportProviders,
      init: initOptions,
    });

    // find CAP_INIT provider and invoke its factory manually
    const initProv = dm.providers?.find(
      (p: any) => p && p.provide === 'CAP_INIT',
    ) as any;
    expect(initProv).toBeDefined();

    // call factory as Nest would, passing the adapter instances
    // the factory was created to accept (pubStorage, recStorage, publisher, subscriber)
    await initProv.useFactory?.(pubStorage, recStorage, publisher, subscriber);

    expect(pubStorage.initialize).toHaveBeenCalledWith(initOptions);
    expect(recStorage.initialize).toHaveBeenCalledWith(initOptions);
    expect(publisher.initialize).toHaveBeenCalledWith(initOptions);
    expect(subscriber.initialize).toHaveBeenCalledWith(initOptions);
  });
});
