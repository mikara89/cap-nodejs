[**CAP Node.js API**](../../README.md)

***

[CAP Node.js API](../../README.md) / cap-core/src

# cap-core/src

## Classes

- [AdapterInitializer](classes/AdapterInitializer.md)
- [CapEngine](classes/CapEngine.md)
- [CapScheduler](classes/CapScheduler.md)
- [CapTransactionContext](classes/CapTransactionContext.md)
- [FakePublisher](classes/FakePublisher.md)
- [FakeSubscriber](classes/FakeSubscriber.md)
- [InMemoryPublishStorage](classes/InMemoryPublishStorage.md)
- [InMemoryReceivedStorage](classes/InMemoryReceivedStorage.md)
- [LocalBus](classes/LocalBus.md)

## Interfaces

- [CapBaseMessage](interfaces/CapBaseMessage.md)
- [CapEngineOptions](interfaces/CapEngineOptions.md)
- [CapLogger](interfaces/CapLogger.md)
- [CapMessageMetadata](interfaces/CapMessageMetadata.md)
- [CapOperationContext](interfaces/CapOperationContext.md)
- [CapPublishEvent](interfaces/CapPublishEvent.md)
- [CapPublishOptions](interfaces/CapPublishOptions.md)
- [CapReceivedEvent](interfaces/CapReceivedEvent.md)
- [CapSchedulerOptions](interfaces/CapSchedulerOptions.md)
- [CapSchedulerRuntimeOptions](interfaces/CapSchedulerRuntimeOptions.md)
- [CapSubscribeOptions](interfaces/CapSubscribeOptions.md)
- [CapTransactionManagerPort](interfaces/CapTransactionManagerPort.md)
- [CapTransactionOptions](interfaces/CapTransactionOptions.md)
- [ClaimUnpublishedOptions](interfaces/ClaimUnpublishedOptions.md)
- [ClockPort](interfaces/ClockPort.md)
- [DashboardListOptions](interfaces/DashboardListOptions.md)
- [DashboardListResult](interfaces/DashboardListResult.md)
- [IdGeneratorPort](interfaces/IdGeneratorPort.md)
- [InboxRetryProcessor](interfaces/InboxRetryProcessor.md)
- [InitOptions](interfaces/InitOptions.md)
- [MarkPublishFailedOptions](interfaces/MarkPublishFailedOptions.md)
- [MarkReceivedFailedOptions](interfaces/MarkReceivedFailedOptions.md)
- [MessageDispatcher](interfaces/MessageDispatcher.md)
- [PublisherPort](interfaces/PublisherPort.md)
- [PublishMetadata](interfaces/PublishMetadata.md)
- [PublishStoragePort](interfaces/PublishStoragePort.md)
- [ReceivedStoragePort](interfaces/ReceivedStoragePort.md)
- [ResolvedCapEngineSchedulerOptions](interfaces/ResolvedCapEngineSchedulerOptions.md)
- [SubscribeMetadata](interfaces/SubscribeMetadata.md)
- [SubscriberPort](interfaces/SubscriberPort.md)
- [TransactionalPublishStoragePort](interfaces/TransactionalPublishStoragePort.md)
- [TrySaveReceivedResult](interfaces/TrySaveReceivedResult.md)

## Type Aliases

- [CapEngineInboxRetryProcessor](type-aliases/CapEngineInboxRetryProcessor.md)
- [CapEngineMessageDispatcher](type-aliases/CapEngineMessageDispatcher.md)
- [CapHandler](type-aliases/CapHandler.md)
- [CapHeaders](type-aliases/CapHeaders.md)
- [CapHeaderValue](type-aliases/CapHeaderValue.md)
- [CapPublishMetadata](type-aliases/CapPublishMetadata.md)
- [CapPublishStatus](type-aliases/CapPublishStatus.md)
- [CapReceivedStatus](type-aliases/CapReceivedStatus.md)
- [CapSubscribeMetadata](type-aliases/CapSubscribeMetadata.md)
- [CapTransactionPropagation](type-aliases/CapTransactionPropagation.md)
- [JsonPrimitive](type-aliases/JsonPrimitive.md)
- [JsonValue](type-aliases/JsonValue.md)

## Variables

- [CAP\_MESSAGE\_ID\_HEADER](variables/CAP_MESSAGE_ID_HEADER.md)
- [noopLogger](variables/noopLogger.md)
- [PUBLISH\_STORAGE](variables/PUBLISH_STORAGE.md)
- [PUBLISHER](variables/PUBLISHER.md)
- [RECEIVED\_STORAGE](variables/RECEIVED_STORAGE.md)
- [SUBSCRIBER](variables/SUBSCRIBER.md)

## Functions

- [calculateBackoff](functions/calculateBackoff.md)
- [createDedupeKey](functions/createDedupeKey.md)
- [createInMemoryPublisher](functions/createInMemoryPublisher.md)
- [createInMemoryPublishStorage](functions/createInMemoryPublishStorage.md)
- [createInMemoryReceivedStorage](functions/createInMemoryReceivedStorage.md)
- [createInMemorySubscriber](functions/createInMemorySubscriber.md)
- [expJitter](functions/expJitter.md)
- [getCapMessageId](functions/getCapMessageId.md)
- [isLegacyTransactionalPublishStorage](functions/isLegacyTransactionalPublishStorage.md)
- [normalizeError](functions/normalizeError.md)
- [resolveOperationContext](functions/resolveOperationContext.md)
- [withCapMessageId](functions/withCapMessageId.md)
- [withTransactionAndPostCommit](functions/withTransactionAndPostCommit.md)
