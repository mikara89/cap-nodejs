[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-dashboard/src](../README.md) / CapDashboardService

# Class: CapDashboardService

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:49](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L49)

## Constructors

### Constructor

> **new CapDashboardService**(`pubStorage`, `recStorage`, `capService?`, `publisher?`, `options?`, `schedulerOptions?`): `CapDashboardService`

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:52](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L52)

#### Parameters

##### pubStorage

`IPublishStorage`

##### recStorage

`IReceivedStorage`

##### capService?

`CapService`

##### publisher?

`IPublisher`

##### options?

[`CapDashboardServiceOptions`](../interfaces/CapDashboardServiceOptions.md) = `...`

##### schedulerOptions?

`ResolvedCapSchedulerOptions` = `DEFAULT_RETRY_OPTIONS`

#### Returns

`CapDashboardService`

## Methods

### flushOutbox()

> **flushOutbox**(): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:230](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L230)

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### getInboxById()

> **getInboxById**(`id`, `full?`): `Promise`\<[`InboxItemDto`](InboxItemDto.md) \| `undefined`\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:182](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L182)

#### Parameters

##### id

`string`

##### full?

`boolean` = `false`

#### Returns

`Promise`\<[`InboxItemDto`](InboxItemDto.md) \| `undefined`\>

***

### getOutboxById()

> **getOutboxById**(`id`, `full?`): `Promise`\<[`OutboxItemDto`](OutboxItemDto.md) \| `undefined`\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:100](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L100)

#### Parameters

##### id

`string`

##### full?

`boolean` = `false`

#### Returns

`Promise`\<[`OutboxItemDto`](OutboxItemDto.md) \| `undefined`\>

***

### listInbox()

> **listInbox**(`query`): `Promise`\<[`InboxPageDto`](InboxPageDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:155](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L155)

#### Parameters

##### query

[`ListQueryDto`](ListQueryDto.md)

#### Returns

`Promise`\<[`InboxPageDto`](InboxPageDto.md)\>

***

### listOutbox()

> **listOutbox**(`query`): `Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:72](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L72)

#### Parameters

##### query

[`ListQueryDto`](ListQueryDto.md)

#### Returns

`Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

***

### markInboxProcessed()

> **markInboxProcessed**(`id`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:218](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L218)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### markOutboxPublished()

> **markOutboxPublished**(`id`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:143](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L143)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### retryInbox()

> **retryInbox**(`id`, `_opts?`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:195](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L195)

#### Parameters

##### id

`string`

##### \_opts?

[`RetryOptions`](../interfaces/RetryOptions.md)

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### retryOutbox()

> **retryOutbox**(`id`, `_opts?`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:113](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L113)

#### Parameters

##### id

`string`

##### \_opts?

[`RetryOptions`](../interfaces/RetryOptions.md)

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>
