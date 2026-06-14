import type { DynamicModule, Provider } from '@nestjs/common';
import { CapModule } from './cap.module';
import { PUBLISHER, SUBSCRIBER } from './abstractions/transport.interface';
import {
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
} from './abstractions/storage.interface';

describe('CapModule initialization', () => {
  it('calls initialize() on adapters when init options provided', async () => {
    const initOptions = { createSchema: true, createQueues: true };

    const pubStorage = { initialize: jest.fn(() => Promise.resolve()) };
    const recStorage = { initialize: jest.fn(() => Promise.resolve()) };
    const publisher = { initialize: jest.fn(() => Promise.resolve()) };
    const subscriber = { initialize: jest.fn(() => Promise.resolve()) };

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
      (
        p,
      ): p is Provider & {
        provide: string;
        useFactory?: (...args: unknown[]) => Promise<void>;
      } =>
        typeof p === 'object' &&
        p !== null &&
        'provide' in p &&
        p.provide === 'CAP_INIT',
    );
    expect(initProv).toBeDefined();

    if (!initProv) {
      throw new Error('CAP_INIT provider not found');
    }

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
