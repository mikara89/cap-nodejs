[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-dashboard/src](../README.md) / CapDashboardService

# Class: CapDashboardService

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:26](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L26)

## Constructors

### Constructor

> **new CapDashboardService**(`pubStorage`, `recStorage`, `capService?`, `publisher?`): `CapDashboardService`

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:28](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L28)

#### Parameters

##### pubStorage

`IPublishStorage`

##### recStorage

`IReceivedStorage`

##### capService?

`CapService`

##### publisher?

`IPublisher`

#### Returns

`CapDashboardService`

## Methods

### flushOutbox()

> **flushOutbox**(): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:249](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L249)

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### getInboxById()

> **getInboxById**(`id`, `full?`): `Promise`\<[`InboxItemDto`](InboxItemDto.md) \| `undefined`\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:188](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L188)

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

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:76](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L76)

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

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:143](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L143)

#### Parameters

##### query

[`ListQueryDto`](ListQueryDto.md)

#### Returns

`Promise`\<[`InboxPageDto`](InboxPageDto.md)\>

***

### listOutbox()

> **listOutbox**(`query`): `Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:35](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L35)

#### Parameters

##### query

[`ListQueryDto`](ListQueryDto.md)

#### Returns

`Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

***

### markInboxProcessed()

> **markInboxProcessed**(`id`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:239](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L239)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### markOutboxPublished()

> **markOutboxPublished**(`id`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:133](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L133)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### retryInbox()

> **retryInbox**(`id`, `_opts?`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:212](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L212)

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

Defined in: [cap-dashboard/src/cap-dashboard.service.ts:101](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-dashboard/src/cap-dashboard.service.ts#L101)

#### Parameters

##### id

`string`

##### \_opts?

[`RetryOptions`](../interfaces/RetryOptions.md)

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>
