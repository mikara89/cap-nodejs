[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-dashboard-core/src](../README.md) / CapDashboardCoreService

# Class: CapDashboardCoreService

Defined in: [cap-dashboard-core/src/dashboard.service.ts:56](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L56)

## Constructors

### Constructor

> **new CapDashboardCoreService**(`options`): `CapDashboardCoreService`

Defined in: [cap-dashboard-core/src/dashboard.service.ts:65](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L65)

#### Parameters

##### options

[`CapDashboardCoreServiceOptions`](../interfaces/CapDashboardCoreServiceOptions.md)

#### Returns

`CapDashboardCoreService`

## Methods

### flushOutbox()

> **flushOutbox**(): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard-core/src/dashboard.service.ts:233](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L233)

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### getInboxById()

> **getInboxById**(`id`, `full?`): `Promise`\<[`InboxItemDto`](InboxItemDto.md) \| `undefined`\>

Defined in: [cap-dashboard-core/src/dashboard.service.ts:185](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L185)

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

Defined in: [cap-dashboard-core/src/dashboard.service.ts:103](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L103)

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

Defined in: [cap-dashboard-core/src/dashboard.service.ts:158](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L158)

#### Parameters

##### query

[`ListQueryDto`](ListQueryDto.md)

#### Returns

`Promise`\<[`InboxPageDto`](InboxPageDto.md)\>

***

### listOutbox()

> **listOutbox**(`query`): `Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

Defined in: [cap-dashboard-core/src/dashboard.service.ts:75](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L75)

#### Parameters

##### query

[`ListQueryDto`](ListQueryDto.md)

#### Returns

`Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

***

### markInboxProcessed()

> **markInboxProcessed**(`id`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard-core/src/dashboard.service.ts:221](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L221)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### markOutboxPublished()

> **markOutboxPublished**(`id`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard-core/src/dashboard.service.ts:146](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L146)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

***

### retryInbox()

> **retryInbox**(`id`, `_opts?`): `Promise`\<[`ActionResultDto`](ActionResultDto.md)\>

Defined in: [cap-dashboard-core/src/dashboard.service.ts:198](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L198)

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

Defined in: [cap-dashboard-core/src/dashboard.service.ts:116](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-core/src/dashboard.service.ts#L116)

#### Parameters

##### id

`string`

##### \_opts?

[`RetryOptions`](../interfaces/RetryOptions.md)

#### Returns

`Promise`\<[`ActionResultDto`](ActionResultDto.md)\>
