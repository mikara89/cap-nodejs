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

    const pubStore = {
      initialize: jest.fn(async (_: unknown) => Promise.resolve()),
    };
    const recStore = {
      initialize: jest.fn(async (_: unknown) => Promise.resolve()),
    };
    const publisher = {
      initialize: jest.fn(async (_: unknown) => Promise.resolve()),
    };
    const subscriber = {
      initialize: jest.fn(async (_: unknown) => Promise.resolve()),
    };

    const module = CapModule.forRoot({
      storage: [
        { provide: PUBLISH_STORAGE, useValue: pubStore },
        { provide: RECEIVED_STORAGE, useValue: recStore },
      ],
      transport: [
        { provide: PUBLISHER, useValue: publisher },
        { provide: SUBSCRIBER, useValue: subscriber },
      ],
      init: initOptions,
    });

    const testingModule = await Test.createTestingModule({
      imports: [module],
    }).compile();

    // At this point Nest should have executed provider factories and
    // the CAP_INIT provider should have called initialize() on any
    // adapter that implements it.
    expect(pubStore.initialize).toHaveBeenCalledWith(initOptions);
    expect(recStore.initialize).toHaveBeenCalledWith(initOptions);
    expect(publisher.initialize).toHaveBeenCalledWith(initOptions);
    expect(subscriber.initialize).toHaveBeenCalledWith(initOptions);

    await testingModule.close();
  });
});
