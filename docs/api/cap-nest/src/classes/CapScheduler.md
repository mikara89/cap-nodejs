[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapScheduler

# Class: CapScheduler

Defined in: cap-core/dist/engine/cap-scheduler.d.ts:8

## Constructors

### Constructor

> **new CapScheduler**(`engine`, `options`, `logger?`): `CapScheduler`

Defined in: cap-core/dist/engine/cap-scheduler.d.ts:16

#### Parameters

##### engine

[`CapEngine`](CapEngine.md)

##### options

[`CapSchedulerRuntimeOptions`](../interfaces/CapSchedulerRuntimeOptions.md)

##### logger?

[`CapLogger`](../interfaces/CapLogger.md)

#### Returns

`CapScheduler`

## Methods

### runInboxRetryOnce()

> **runInboxRetryOnce**(): `Promise`\<`number`\>

Defined in: cap-core/dist/engine/cap-scheduler.d.ts:20

#### Returns

`Promise`\<`number`\>

***

### runOutboxOnce()

> **runOutboxOnce**(): `Promise`\<`number`\>

Defined in: cap-core/dist/engine/cap-scheduler.d.ts:19

#### Returns

`Promise`\<`number`\>

***

### start()

> **start**(): `void`

Defined in: cap-core/dist/engine/cap-scheduler.d.ts:17

#### Returns

`void`

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: cap-core/dist/engine/cap-scheduler.d.ts:18

#### Returns

`Promise`\<`void`\>
