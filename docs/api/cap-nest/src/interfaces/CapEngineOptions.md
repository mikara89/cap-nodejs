[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapEngineOptions

# Interface: CapEngineOptions

Defined in: cap-core/dist/engine/cap-engine.d.ts:22

## Properties

### idGenerator?

> `optional` **idGenerator?**: () => `string`

Defined in: cap-core/dist/engine/cap-engine.d.ts:31

#### Returns

`string`

***

### instanceId?

> `optional` **instanceId?**: `string`

Defined in: cap-core/dist/engine/cap-engine.d.ts:29

***

### logger?

> `optional` **logger?**: [`CapLogger`](CapLogger.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:28

***

### now?

> `optional` **now?**: () => `Date`

Defined in: cap-core/dist/engine/cap-engine.d.ts:30

#### Returns

`Date`

***

### publisher

> **publisher**: [`PublisherPort`](PublisherPort.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:25

***

### publishStorage

> **publishStorage**: [`PublishStoragePort`](PublishStoragePort.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:23

***

### receivedStorage

> **receivedStorage**: [`ReceivedStoragePort`](ReceivedStoragePort.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:24

***

### scheduler?

> `optional` **scheduler?**: `CapSchedulerOptions`

Defined in: cap-core/dist/engine/cap-engine.d.ts:27

***

### subscriber

> **subscriber**: [`SubscriberPort`](SubscriberPort.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:26

***

### transactionContext?

> `optional` **transactionContext?**: [`CapTransactionContext`](../classes/CapTransactionContext.md)\<`unknown`\>

Defined in: cap-core/dist/engine/cap-engine.d.ts:33

***

### transactionManager?

> `optional` **transactionManager?**: [`CapTransactionManagerPort`](CapTransactionManagerPort.md)\<`unknown`\>

Defined in: cap-core/dist/engine/cap-engine.d.ts:32
