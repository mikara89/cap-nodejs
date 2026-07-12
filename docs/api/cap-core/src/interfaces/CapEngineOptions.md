[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapEngineOptions

# Interface: CapEngineOptions

Defined in: [cap-core/src/engine/cap-engine.ts:55](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L55)

## Properties

### idGenerator?

> `optional` **idGenerator?**: () => `string`

Defined in: [cap-core/src/engine/cap-engine.ts:64](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L64)

#### Returns

`string`

***

### instanceId?

> `optional` **instanceId?**: `string`

Defined in: [cap-core/src/engine/cap-engine.ts:62](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L62)

***

### logger?

> `optional` **logger?**: [`CapLogger`](CapLogger.md)

Defined in: [cap-core/src/engine/cap-engine.ts:61](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L61)

***

### now?

> `optional` **now?**: () => `Date`

Defined in: [cap-core/src/engine/cap-engine.ts:63](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L63)

#### Returns

`Date`

***

### publisher

> **publisher**: [`PublisherPort`](PublisherPort.md)

Defined in: [cap-core/src/engine/cap-engine.ts:58](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L58)

***

### publishStorage

> **publishStorage**: [`PublishStoragePort`](PublishStoragePort.md)

Defined in: [cap-core/src/engine/cap-engine.ts:56](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L56)

***

### receivedStorage

> **receivedStorage**: [`ReceivedStoragePort`](ReceivedStoragePort.md)

Defined in: [cap-core/src/engine/cap-engine.ts:57](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L57)

***

### scheduler?

> `optional` **scheduler?**: [`CapSchedulerOptions`](CapSchedulerOptions.md)

Defined in: [cap-core/src/engine/cap-engine.ts:60](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L60)

***

### subscriber

> **subscriber**: [`SubscriberPort`](SubscriberPort.md)

Defined in: [cap-core/src/engine/cap-engine.ts:59](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L59)

***

### transactionContext?

> `optional` **transactionContext?**: [`CapTransactionContext`](../classes/CapTransactionContext.md)\<`unknown`\>

Defined in: [cap-core/src/engine/cap-engine.ts:66](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L66)

***

### transactionManager?

> `optional` **transactionManager?**: [`CapTransactionManagerPort`](CapTransactionManagerPort.md)\<`unknown`\>

Defined in: [cap-core/src/engine/cap-engine.ts:65](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L65)
