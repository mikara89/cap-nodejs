[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-dashboard-nest/src](../README.md) / CapDashboardController

# Class: CapDashboardController

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L22)

## Constructors

### Constructor

> **new CapDashboardController**(`svc`): `CapDashboardController`

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:23](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L23)

#### Parameters

##### svc

[`CapDashboardService`](CapDashboardService.md)

#### Returns

`CapDashboardController`

## Methods

### flushOutbox()

> **flushOutbox**(): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:87](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L87)

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

***

### getInbox()

> **getInbox**(`id`, `full?`): `Promise`\<[`InboxItemDto`](InboxItemDto.md) \| `undefined`\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:63](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L63)

#### Parameters

##### id

`string`

##### full?

`boolean`

#### Returns

`Promise`\<[`InboxItemDto`](InboxItemDto.md) \| `undefined`\>

***

### getOutbox()

> **getOutbox**(`id`, `full?`): `Promise`\<[`OutboxItemDto`](../../../cap-dashboard-core/src/classes/OutboxItemDto.md) \| `undefined`\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:33](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L33)

#### Parameters

##### id

`string`

##### full?

`boolean`

#### Returns

`Promise`\<[`OutboxItemDto`](../../../cap-dashboard-core/src/classes/OutboxItemDto.md) \| `undefined`\>

***

### listInbox()

> **listInbox**(`q`): `Promise`\<[`InboxPageDto`](../../../cap-dashboard-core/src/classes/InboxPageDto.md)\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:57](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L57)

#### Parameters

##### q

[`ListQueryDto`](../../../cap-dashboard-core/src/classes/ListQueryDto.md)

#### Returns

`Promise`\<[`InboxPageDto`](../../../cap-dashboard-core/src/classes/InboxPageDto.md)\>

***

### listOutbox()

> **listOutbox**(`q`): `Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:27](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L27)

#### Parameters

##### q

[`ListQueryDto`](../../../cap-dashboard-core/src/classes/ListQueryDto.md)

#### Returns

`Promise`\<[`OutboxPageDto`](OutboxPageDto.md)\>

***

### markInboxProcessed()

> **markInboxProcessed**(`id`): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:81](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L81)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

***

### markOutboxPublished()

> **markOutboxPublished**(`id`): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:51](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L51)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

***

### retryInbox()

> **retryInbox**(`id`, `opts?`): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:72](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L72)

#### Parameters

##### id

`string`

##### opts?

[`RetryOptions`](../interfaces/RetryOptions.md)

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

***

### retryOutbox()

> **retryOutbox**(`id`, `opts?`): `Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>

Defined in: [cap-dashboard-nest/src/cap-dashboard.controller.ts:42](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-dashboard-nest/src/cap-dashboard.controller.ts#L42)

#### Parameters

##### id

`string`

##### opts?

[`RetryOptions`](../interfaces/RetryOptions.md)

#### Returns

`Promise`\<[`ActionResultDto`](../../../cap-dashboard-core/src/classes/ActionResultDto.md)\>
