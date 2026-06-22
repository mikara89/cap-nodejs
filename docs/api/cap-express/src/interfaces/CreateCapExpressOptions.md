[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-express/src](../README.md) / CreateCapExpressOptions

# Interface: CreateCapExpressOptions

Defined in: cap-express/src/create-cap-express.ts:23

## Properties

### autoStart?

> `optional` **autoStart?**: `boolean`

Defined in: cap-express/src/create-cap-express.ts:33

***

### idGenerator?

> `optional` **idGenerator?**: () => `string`

Defined in: cap-express/src/create-cap-express.ts:32

#### Returns

`string`

***

### instanceId?

> `optional` **instanceId?**: `string`

Defined in: cap-express/src/create-cap-express.ts:30

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: cap-express/src/create-cap-express.ts:29

***

### now?

> `optional` **now?**: () => `Date`

Defined in: cap-express/src/create-cap-express.ts:31

#### Returns

`Date`

***

### publisher

> **publisher**: [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

Defined in: cap-express/src/create-cap-express.ts:26

***

### publishStorage

> **publishStorage**: [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)

Defined in: cap-express/src/create-cap-express.ts:24

***

### receivedStorage

> **receivedStorage**: [`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md)

Defined in: cap-express/src/create-cap-express.ts:25

***

### scheduler?

> `optional` **scheduler?**: [`CapExpressSchedulerOptions`](CapExpressSchedulerOptions.md)

Defined in: cap-express/src/create-cap-express.ts:28

***

### subscriber

> **subscriber**: [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

Defined in: cap-express/src/create-cap-express.ts:27
