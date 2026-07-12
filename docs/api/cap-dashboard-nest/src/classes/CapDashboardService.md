[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-dashboard-nest/src](../README.md) / CapDashboardService

# Class: CapDashboardService

Defined in: [cap-dashboard-nest/src/cap-dashboard.service.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.service.ts#L32)

## Extends

- `CapDashboardCoreService`

## Constructors

### Constructor

> **new CapDashboardService**(`publishStorage`, `receivedStorage`, `capService?`, `publisher?`, `options?`, `schedulerOptions?`): `CapDashboardService`

Defined in: [cap-dashboard-nest/src/cap-dashboard.service.ts:33](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.service.ts#L33)

#### Parameters

##### publishStorage

[`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)

##### receivedStorage

[`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md)

##### capService?

`CapService`

##### publisher?

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

##### options?

[`CapDashboardServiceOptions`](../interfaces/CapDashboardServiceOptions.md)

##### schedulerOptions?

`ResolvedCapSchedulerOptions` = `DEFAULT_RETRY_OPTIONS`

#### Returns

`CapDashboardService`

#### Overrides

`CapDashboardCoreService.constructor`

## Methods

### flushOutbox()

> **flushOutbox**(): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:50

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

#### Inherited from

`CapDashboardCoreService.flushOutbox`

***

### getInboxById()

> **getInboxById**(`id`, `full?`): `Promise`\<[`InboxItemDto`](InboxItemDto.md) \| `undefined`\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:47

#### Parameters

##### id

`string`

##### full?

`boolean`

#### Returns

`Promise`\<[`InboxItemDto`](InboxItemDto.md) \| `undefined`\>

#### Inherited from

`CapDashboardCoreService.getInboxById`

***

### getOutboxById()

> **getOutboxById**(`id`, `full?`): `Promise`\<[`OutboxItemDto`](../../../cap-dashboard-core/src/classes/OutboxItemDto.md) \| `undefined`\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:43

#### Parameters

##### id

`string`

##### full?

`boolean`

#### Returns

`Promise`\<[`OutboxItemDto`](../../../cap-dashboard-core/src/classes/OutboxItemDto.md) \| `undefined`\>

#### Inherited from

`CapDashboardCoreService.getOutboxById`

***

### listInbox()

> **listInbox**(`query`): `Promise`\<[`InboxPageDto`](../../../cap-dashboard-core/src/classes/InboxPageDto.md)\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:46

#### Parameters

##### query

[`ListQueryDto`](../../../cap-dashboard-core/src/classes/ListQueryDto.md)

#### Returns

`Promise`\<[`InboxPageDto`](../../../cap-dashboard-core/src/classes/InboxPageDto.md)\>

#### Inherited from

`CapDashboardCoreService.listInbox`

***

### listOutbox()

> **listOutbox**(`query`): `Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:42

#### Parameters

##### query

[`ListQueryDto`](../../../cap-dashboard-core/src/classes/ListQueryDto.md)

#### Returns

`Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

#### Inherited from

`CapDashboardCoreService.listOutbox`

***

### markInboxProcessed()

> **markInboxProcessed**(`id`): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:49

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

#### Inherited from

`CapDashboardCoreService.markInboxProcessed`

***

### markOutboxPublished()

> **markOutboxPublished**(`id`): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:45

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

#### Inherited from

`CapDashboardCoreService.markOutboxPublished`

***

### retryInbox()

> **retryInbox**(`id`, `_opts?`): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:48

#### Parameters

##### id

`string`

##### \_opts?

[`RetryOptions`](../interfaces/RetryOptions.md)

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

#### Inherited from

`CapDashboardCoreService.retryInbox`

***

### retryOutbox()

> **retryOutbox**(`id`, `_opts?`): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: cap-dashboard-core/dist/dashboard.service.d.ts:44

#### Parameters

##### id

`string`

##### \_opts?

[`RetryOptions`](../interfaces/RetryOptions.md)

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

#### Inherited from

`CapDashboardCoreService.retryOutbox`
