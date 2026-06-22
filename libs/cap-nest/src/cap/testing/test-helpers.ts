import {
  createInMemoryPublishStorage as createCoreInMemoryPublishStorage,
  createInMemoryPublisher as createCoreInMemoryPublisher,
  createInMemoryReceivedStorage as createCoreInMemoryReceivedStorage,
  createInMemorySubscriber as createCoreInMemorySubscriber,
} from '@mikara89/cap-core';

import {
  type CapDeliveryMetadata,
  type CapPublishMetadata,
  type IPublisher,
  type ISubscriber,
} from '../abstractions/transport.interface';
import {
  type IPublishStorage,
  type IReceivedStorage,
} from '../abstractions/storage.interface';
import { type CapPublishEvent } from '../models/cap-publish-event';
import { type CapReceivedEvent } from '../models/cap-received-event';
import { type CapHeaders } from '../models/cap-headers.type';
import { type JsonValue } from '../models/json-value.type';

export function createInMemoryPublisher(): IPublisher & {
  emitted: Array<{
    topic: string;
    payload: unknown;
    headers?: CapHeaders;
    metadata?: CapPublishMetadata;
  }>;
} {
  return createCoreInMemoryPublisher();
}

export function createInMemorySubscriber(): ISubscriber & {
  listeners: Map<
    string,
    Set<(p: unknown, h?: CapHeaders, m?: CapDeliveryMetadata) => Promise<void>>
  >;
} {
  return createCoreInMemorySubscriber() as unknown as ISubscriber & {
    listeners: Map<
      string,
      Set<
        (p: unknown, h?: CapHeaders, m?: CapDeliveryMetadata) => Promise<void>
      >
    >;
  };
}

export function createInMemoryPublishStorage(): IPublishStorage & {
  store: Map<string, CapPublishEvent<JsonValue>>;
} {
  return createCoreInMemoryPublishStorage();
}

export function createInMemoryReceivedStorage(): IReceivedStorage & {
  store: Map<string, CapReceivedEvent<JsonValue>>;
} {
  return createCoreInMemoryReceivedStorage();
}
