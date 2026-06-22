[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-core/src](../README.md) / CapEngineOptions

# Interface: CapEngineOptions

Defined in: cap-core/src/engine/cap-engine.ts:47

## Properties

### idGenerator?

> `optional` **idGenerator?**: () => `string`

Defined in: cap-core/src/engine/cap-engine.ts:56

#### Returns

`string`

***

### instanceId?

> `optional` **instanceId?**: `string`

Defined in: cap-core/src/engine/cap-engine.ts:54

***

### logger?

> `optional` **logger?**: [`CapLogger`](CapLogger.md)

Defined in: cap-core/src/engine/cap-engine.ts:53

***

### now?

> `optional` **now?**: () => `Date`

Defined in: cap-core/src/engine/cap-engine.ts:55

#### Returns

`Date`

***

### publisher

> **publisher**: [`PublisherPort`](PublisherPort.md)

Defined in: cap-core/src/engine/cap-engine.ts:50

***

### publishStorage

> **publishStorage**: [`PublishStoragePort`](PublishStoragePort.md)

Defined in: cap-core/src/engine/cap-engine.ts:48

***

### receivedStorage

> **receivedStorage**: [`ReceivedStoragePort`](ReceivedStoragePort.md)

Defined in: cap-core/src/engine/cap-engine.ts:49

***

### scheduler?

> `optional` **scheduler?**: [`CapSchedulerOptions`](CapSchedulerOptions.md)

Defined in: cap-core/src/engine/cap-engine.ts:52

***

### subscriber

> **subscriber**: [`SubscriberPort`](SubscriberPort.md)

Defined in: cap-core/src/engine/cap-engine.ts:51
