[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapEngineOptions

# Interface: CapEngineOptions

Defined in: cap-core/src/engine/cap-engine.ts:54

## Properties

### idGenerator?

> `optional` **idGenerator?**: () => `string`

Defined in: cap-core/src/engine/cap-engine.ts:63

#### Returns

`string`

***

### instanceId?

> `optional` **instanceId?**: `string`

Defined in: cap-core/src/engine/cap-engine.ts:61

***

### logger?

> `optional` **logger?**: [`CapLogger`](CapLogger.md)

Defined in: cap-core/src/engine/cap-engine.ts:60

***

### now?

> `optional` **now?**: () => `Date`

Defined in: cap-core/src/engine/cap-engine.ts:62

#### Returns

`Date`

***

### publisher

> **publisher**: [`PublisherPort`](PublisherPort.md)

Defined in: cap-core/src/engine/cap-engine.ts:57

***

### publishStorage

> **publishStorage**: [`PublishStoragePort`](PublishStoragePort.md)

Defined in: cap-core/src/engine/cap-engine.ts:55

***

### receivedStorage

> **receivedStorage**: [`ReceivedStoragePort`](ReceivedStoragePort.md)

Defined in: cap-core/src/engine/cap-engine.ts:56

***

### scheduler?

> `optional` **scheduler?**: [`CapSchedulerOptions`](CapSchedulerOptions.md)

Defined in: cap-core/src/engine/cap-engine.ts:59

***

### subscriber

> **subscriber**: [`SubscriberPort`](SubscriberPort.md)

Defined in: cap-core/src/engine/cap-engine.ts:58

***

### transactionContext?

> `optional` **transactionContext?**: [`CapTransactionContext`](../classes/CapTransactionContext.md)\<`unknown`\>

Defined in: cap-core/src/engine/cap-engine.ts:65

***

### transactionManager?

> `optional` **transactionManager?**: [`CapTransactionManagerPort`](CapTransactionManagerPort.md)\<`unknown`\>

Defined in: cap-core/src/engine/cap-engine.ts:64
