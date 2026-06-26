[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapScheduler

# Class: CapScheduler

Defined in: cap-core/src/engine/cap-scheduler.ts:10

## Constructors

### Constructor

> **new CapScheduler**(`engine`, `options`, `logger?`): `CapScheduler`

Defined in: cap-core/src/engine/cap-scheduler.ts:16

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

Defined in: cap-core/src/engine/cap-scheduler.ts:67

#### Returns

`Promise`\<`number`\>

***

### runOutboxOnce()

> **runOutboxOnce**(): `Promise`\<`number`\>

Defined in: cap-core/src/engine/cap-scheduler.ts:50

#### Returns

`Promise`\<`number`\>

***

### start()

> **start**(): `void`

Defined in: cap-core/src/engine/cap-scheduler.ts:22

#### Returns

`void`

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: cap-core/src/engine/cap-scheduler.ts:34

#### Returns

`Promise`\<`void`\>
