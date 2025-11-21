import { CapModule } from './cap.module';
import { DynamicModule } from '@nestjs/common';
import { PUBLISHER, SUBSCRIBER } from './abstractions/transport.interface';
import {
  PUBLISH_STORAGE,
  RECEIVED_STORAGE,
} from './abstractions/storage.interface';

describe('CapModule builders', () => {
  it('forInMemory returns DynamicModule with adapters containing provider tokens', () => {
    const dm = CapModule.forInMemory();

    // adaptersModule is the first import
    const adapters = (dm.imports && dm.imports[0]) as DynamicModule | undefined;
    expect(adapters).toBeDefined();
    // adapters should expose providers array
    // Providers should include the in-memory storage classes and transport providers
    const providers = adapters?.providers || [];

    const hasPublishStorage = providers.some(
      (p) =>
        p && ((p as any).provide === PUBLISH_STORAGE || (p as any).useClass),
    );
    const hasReceivedStorage = providers.some(
      (p) =>
        p && ((p as any).provide === RECEIVED_STORAGE || (p as any).useClass),
    );
    const hasPublisher = providers.some(
      (p) => p && (p as any).provide === PUBLISHER,
    );
    const hasSubscriber = providers.some(
      (p) => p && (p as any).provide === SUBSCRIBER,
    );

    expect(hasPublishStorage).toBe(true);
    expect(hasReceivedStorage).toBe(true);
    expect(hasPublisher).toBe(true);
    expect(hasSubscriber).toBe(true);
  });
});
