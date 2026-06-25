[**CAP Node.js API**](../../README.md)

***

[CAP Node.js API](../../README.md) / cap-nest/src

# cap-nest/src

## Classes

- [AdapterInitializer](classes/AdapterInitializer.md)
- [CapEngine](classes/CapEngine.md)
- [CapModule](classes/CapModule.md)
- [CapScheduler](classes/CapScheduler.md)
- [CapService](classes/CapService.md)
- [CapSubscriberScanner](classes/CapSubscriberScanner.md)
- [CapTransactionContext](classes/CapTransactionContext.md)
- [LocalBus](classes/LocalBus.md)
- [RetrySchedulerService](classes/RetrySchedulerService.md)

## Interfaces

- [CapBaseMessage](interfaces/CapBaseMessage.md)
- [CapDeliveryMetadata](interfaces/CapDeliveryMetadata.md)
- [CapEngineOptions](interfaces/CapEngineOptions.md)
- [CapLogger](interfaces/CapLogger.md)
- [CapModuleAsyncOptions](interfaces/CapModuleAsyncOptions.md)
- [CapModuleFactory](interfaces/CapModuleFactory.md)
- [CapModuleOptions](interfaces/CapModuleOptions.md)
- [CapOperationContext](interfaces/CapOperationContext.md)
- [CapPublishEvent](interfaces/CapPublishEvent.md)
- [CapPublishMetadata](interfaces/CapPublishMetadata.md)
- [CapPublishOptions](interfaces/CapPublishOptions.md)
- [CapReceivedEvent](interfaces/CapReceivedEvent.md)
- [CapSchedulerOptions](interfaces/CapSchedulerOptions.md)
- [CapSchedulerRuntimeOptions](interfaces/CapSchedulerRuntimeOptions.md)
- [CapSubscribeOptions](interfaces/CapSubscribeOptions.md)
- [CapTransactionManagerPort](interfaces/CapTransactionManagerPort.md)
- [CapTransactionOptions](interfaces/CapTransactionOptions.md)
- [ClaimUnpublishedOptions](interfaces/ClaimUnpublishedOptions.md)
- [DashboardListOptions](interfaces/DashboardListOptions.md)
- [DashboardListResult](interfaces/DashboardListResult.md)
- [DiscoveredSubscription](interfaces/DiscoveredSubscription.md)
- [InitOptions](interfaces/InitOptions.md)
- [IPublisher](interfaces/IPublisher.md)
- [IPublishStorage](interfaces/IPublishStorage.md)
- [IReceivedStorage](interfaces/IReceivedStorage.md)
- [ISubscriber](interfaces/ISubscriber.md)
- [ITransactionalPublishStorage](interfaces/ITransactionalPublishStorage.md)
- [MarkPublishFailedOptions](interfaces/MarkPublishFailedOptions.md)
- [MarkReceivedFailedOptions](interfaces/MarkReceivedFailedOptions.md)
- [PublisherPort](interfaces/PublisherPort.md)
- [PublishMetadata](interfaces/PublishMetadata.md)
- [PublishStoragePort](interfaces/PublishStoragePort.md)
- [ReceivedStoragePort](interfaces/ReceivedStoragePort.md)
- [ResolvedCapEngineSchedulerOptions](interfaces/ResolvedCapEngineSchedulerOptions.md)
- [ResolvedCapSchedulerOptions](interfaces/ResolvedCapSchedulerOptions.md)
- [SubscribeMetadata](interfaces/SubscribeMetadata.md)
- [SubscriberPort](interfaces/SubscriberPort.md)
- [TransactionalPublishStoragePort](interfaces/TransactionalPublishStoragePort.md)
- [TrySaveReceivedResult](interfaces/TrySaveReceivedResult.md)

## Type Aliases

- [CapHandler](type-aliases/CapHandler.md)
- [CapHeaders](type-aliases/CapHeaders.md)
- [CapHeaderValue](type-aliases/CapHeaderValue.md)
- [CapPublishStatus](type-aliases/CapPublishStatus.md)
- [CapReceivedStatus](type-aliases/CapReceivedStatus.md)
- [CapTransactionPropagation](type-aliases/CapTransactionPropagation.md)
- [JsonPrimitive](type-aliases/JsonPrimitive.md)
- [JsonValue](type-aliases/JsonValue.md)

## Variables

- [CAP\_ENGINE](variables/CAP_ENGINE.md)
- [CAP\_MESSAGE\_ID\_HEADER](variables/CAP_MESSAGE_ID_HEADER.md)
- [CAP\_MODULE\_OPTIONS](variables/CAP_MODULE_OPTIONS.md)
- [CAP\_SCHEDULER](variables/CAP_SCHEDULER.md)
- [CAP\_SCHEDULER\_OPTIONS](variables/CAP_SCHEDULER_OPTIONS.md)
- [CAP\_SUBSCRIBE\_METADATA](variables/CAP_SUBSCRIBE_METADATA.md)
- [PUBLISH\_STORAGE](variables/PUBLISH_STORAGE.md)
- [PUBLISHER](variables/PUBLISHER.md)
- [RECEIVED\_STORAGE](variables/RECEIVED_STORAGE.md)
- [SUBSCRIBER](variables/SUBSCRIBER.md)

## Functions

- [calculateBackoff](functions/calculateBackoff.md)
- [CapSubscribe](functions/CapSubscribe.md)
- [createNestLogger](functions/createNestLogger.md)
- [discoverSubscriptions](functions/discoverSubscriptions.md)
- [expJitter](functions/expJitter.md)
- [withCapMessageId](functions/withCapMessageId.md)
- [withTransactionAndPostCommit](functions/withTransactionAndPostCommit.md)

## References

### NestCapSchedulerService

Renames and re-exports [RetrySchedulerService](classes/RetrySchedulerService.md)
