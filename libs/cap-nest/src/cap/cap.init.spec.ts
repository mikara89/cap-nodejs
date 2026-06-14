import { DynamicModule } from '@nestjs/common';
import { CapModule } from './cap.module';
import { PUBLISHER, SUBSCRIBER } from './abstractions/transport.interface';
import {
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
} from './abstractions/storage.interface';

describe('CapModule initialization', () => {
  it('calls initialize() on adapters when init options provided', async () => {
    const initOptions = { createSchema: true, createQueues: true };

    const pubStorage = { initialize: jest.fn(async () => undefined) };
    const recStorage = { initialize: jest.fn(async () => undefined) };
    const publisher = { initialize: jest.fn(async () => undefined) };
    const subscriber = { initialize: jest.fn(async () => undefined) };

    const adaptersModule: DynamicModule = {
      module: class TestAdaptersModule {},
      providers: [
        { provide: PUBLISH_STORAGE, useValue: pubStorage },
        { provide: RECEIVED_STORAGE, useValue: recStorage },
        { provide: PUBLISHER, useValue: publisher },
        { provide: SUBSCRIBER, useValue: subscriber },
      ],
      exports: [PUBLISH_STORAGE, RECEIVED_STORAGE, PUBLISHER, SUBSCRIBER],
    };

    const dm = CapModule.forRoot({
      imports: [adaptersModule],
      init: initOptions,
    });

    const initProv = dm.providers?.find(
      (p: any) => p?.provide === 'CAP_INIT',
    ) as any;
    expect(initProv).toBeDefined();

    await initProv.useFactory?.(
      { init: initOptions },
      pubStorage,
      recStorage,
      publisher,
      subscriber,
    );

    expect(pubStorage.initialize).toHaveBeenCalledWith(initOptions);
    expect(recStorage.initialize).toHaveBeenCalledWith(initOptions);
    expect(publisher.initialize).toHaveBeenCalledWith(initOptions);
    expect(subscriber.initialize).toHaveBeenCalledWith(initOptions);
  });
});
