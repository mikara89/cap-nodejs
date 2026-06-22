[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / CapEngineOptions

# Interface: CapEngineOptions

Defined in: cap-core/dist/engine/cap-engine.d.ts:19

## Properties

### idGenerator?

> `optional` **idGenerator?**: () => `string`

Defined in: cap-core/dist/engine/cap-engine.d.ts:28

#### Returns

`string`

***

### instanceId?

> `optional` **instanceId?**: `string`

Defined in: cap-core/dist/engine/cap-engine.d.ts:26

***

### logger?

> `optional` **logger?**: [`CapLogger`](CapLogger.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:25

***

### now?

> `optional` **now?**: () => `Date`

Defined in: cap-core/dist/engine/cap-engine.d.ts:27

#### Returns

`Date`

***

### publisher

> **publisher**: [`PublisherPort`](PublisherPort.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:22

***

### publishStorage

> **publishStorage**: [`PublishStoragePort`](PublishStoragePort.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:20

***

### receivedStorage

> **receivedStorage**: [`ReceivedStoragePort`](ReceivedStoragePort.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:21

***

### scheduler?

> `optional` **scheduler?**: `CapSchedulerOptions`

Defined in: cap-core/dist/engine/cap-engine.d.ts:24

***

### subscriber

> **subscriber**: [`SubscriberPort`](SubscriberPort.md)

Defined in: cap-core/dist/engine/cap-engine.d.ts:23
