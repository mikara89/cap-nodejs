import { DynamicModule } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CapModule } from './cap.module';
import { PUBLISHER, SUBSCRIBER } from './abstractions/transport.interface';
import {
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
} from './abstractions/storage.interface';

describe('CapModule bootstrap integration', () => {
  it('invokes initialize() on adapters during Nest bootstrap', async () => {
    const initOptions = { createSchema: true, createQueues: true };

    const pubStore = { initialize: jest.fn(async () => undefined) };
    const recStore = { initialize: jest.fn(async () => undefined) };
    const publisher = { initialize: jest.fn(async () => undefined) };
    const subscriber = { initialize: jest.fn(async () => undefined) };

    const adaptersModule: DynamicModule = {
      module: class TestAdaptersModule {},
      providers: [
        { provide: PUBLISH_STORAGE, useValue: pubStore },
        { provide: RECEIVED_STORAGE, useValue: recStore },
        { provide: PUBLISHER, useValue: publisher },
        { provide: SUBSCRIBER, useValue: subscriber },
      ],
      exports: [PUBLISH_STORAGE, RECEIVED_STORAGE, PUBLISHER, SUBSCRIBER],
    };

    const module = CapModule.forRoot({
      imports: [adaptersModule],
      init: initOptions,
      scheduler: { disabled: true },
    });

    const testingModule = await Test.createTestingModule({
      imports: [module],
    }).compile();

    expect(pubStore.initialize).toHaveBeenCalledWith(initOptions);
    expect(recStore.initialize).toHaveBeenCalledWith(initOptions);
    expect(publisher.initialize).toHaveBeenCalledWith(initOptions);
    expect(subscriber.initialize).toHaveBeenCalledWith(initOptions);

    await testingModule.close();
  });
});
