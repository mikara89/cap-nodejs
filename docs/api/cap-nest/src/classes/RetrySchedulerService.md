[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / RetrySchedulerService

# Class: RetrySchedulerService

Defined in: [cap-nest/src/cap/scheduler/schedule.service.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/scheduler/schedule.service.ts#L19)

## Implements

- `OnModuleDestroy`

## Constructors

### Constructor

> **new RetrySchedulerService**(`cap`, `options?`, `schedulerRegistry?`): `RetrySchedulerService`

Defined in: [cap-nest/src/cap/scheduler/schedule.service.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/scheduler/schedule.service.ts#L22)

#### Parameters

##### cap

[`CapService`](CapService.md)

##### options?

[`ResolvedCapSchedulerOptions`](../interfaces/ResolvedCapSchedulerOptions.md) = `...`

##### schedulerRegistry?

`SchedulerRegistry`

#### Returns

`RetrySchedulerService`

## Methods

### flushOutbox()

> **flushOutbox**(): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/scheduler/schedule.service.ts:40](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/scheduler/schedule.service.ts#L40)

#### Returns

`Promise`\<`void`\>

***

### onModuleDestroy()

> **onModuleDestroy**(): `void`

Defined in: [cap-nest/src/cap/scheduler/schedule.service.ts:57](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/scheduler/schedule.service.ts#L57)

#### Returns

`void`

#### Implementation of

`OnModuleDestroy.onModuleDestroy`

***

### retryInbox()

> **retryInbox**(): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/scheduler/schedule.service.ts:49](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-nest/src/cap/scheduler/schedule.service.ts#L49)

#### Returns

`Promise`\<`void`\>
