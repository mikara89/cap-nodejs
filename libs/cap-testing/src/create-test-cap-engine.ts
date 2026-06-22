import {
  CapEngine,
  createInMemoryPublishStorage,
  createInMemoryPublisher,
  createInMemoryReceivedStorage,
  createInMemorySubscriber,
  type CapEngineOptions,
  type CapSchedulerOptions,
  type FakePublisher,
  type FakeSubscriber,
  type InMemoryPublishStorage,
  type InMemoryReceivedStorage,
} from '@mikara89/cap-core';

export interface TestCapEngineOptions {
  scheduler?: CapSchedulerOptions;
  now?: CapEngineOptions['now'];
  idGenerator?: CapEngineOptions['idGenerator'];
}

export interface TestCapEngine {
  engine: CapEngine;
  publishStorage: InMemoryPublishStorage;
  receivedStorage: InMemoryReceivedStorage;
  publisher: FakePublisher;
  subscriber: FakeSubscriber;
}

export function createTestCapEngine(
  options: TestCapEngineOptions = {},
): TestCapEngine {
  const publishStorage = createInMemoryPublishStorage();
  const receivedStorage = createInMemoryReceivedStorage();
  const publisher = createInMemoryPublisher();
  const subscriber = createInMemorySubscriber();
  const engine = new CapEngine({
    publishStorage,
    receivedStorage,
    publisher,
    subscriber,
    scheduler: options.scheduler,
    now: options.now,
    idGenerator: options.idGenerator,
  });

  return {
    engine,
    publishStorage,
    receivedStorage,
    publisher,
    subscriber,
  };
}
