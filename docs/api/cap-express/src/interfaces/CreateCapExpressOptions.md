[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-express/src](../README.md) / CreateCapExpressOptions

# Interface: CreateCapExpressOptions

Defined in: [cap-express/src/create-cap-express.ts:26](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L26)

## Properties

### autoStart?

> `optional` **autoStart?**: `boolean`

Defined in: [cap-express/src/create-cap-express.ts:38](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L38)

***

### idGenerator?

> `optional` **idGenerator?**: () => `string`

Defined in: [cap-express/src/create-cap-express.ts:35](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L35)

#### Returns

`string`

***

### init?

> `optional` **init?**: `InitOptions`

Defined in: [cap-express/src/create-cap-express.ts:39](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L39)

***

### instanceId?

> `optional` **instanceId?**: `string`

Defined in: [cap-express/src/create-cap-express.ts:33](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L33)

***

### logger?

> `optional` **logger?**: [`CapLogger`](../../../cap-nest/src/interfaces/CapLogger.md)

Defined in: [cap-express/src/create-cap-express.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L32)

***

### now?

> `optional` **now?**: () => `Date`

Defined in: [cap-express/src/create-cap-express.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L34)

#### Returns

`Date`

***

### publisher

> **publisher**: [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

Defined in: [cap-express/src/create-cap-express.ts:29](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L29)

***

### publishStorage

> **publishStorage**: [`PublishStoragePort`](../../../cap-nest/src/interfaces/PublishStoragePort.md)

Defined in: [cap-express/src/create-cap-express.ts:27](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L27)

***

### receivedStorage

> **receivedStorage**: [`ReceivedStoragePort`](../../../cap-nest/src/interfaces/ReceivedStoragePort.md)

Defined in: [cap-express/src/create-cap-express.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L28)

***

### scheduler?

> `optional` **scheduler?**: [`CapExpressSchedulerOptions`](CapExpressSchedulerOptions.md)

Defined in: [cap-express/src/create-cap-express.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L31)

***

### subscriber

> **subscriber**: [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

Defined in: [cap-express/src/create-cap-express.ts:30](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L30)

***

### transactionContext?

> `optional` **transactionContext?**: [`CapTransactionContext`](../../../cap-nest/src/classes/CapTransactionContext.md)\<`unknown`\>

Defined in: [cap-express/src/create-cap-express.ts:37](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L37)

***

### transactionManager?

> `optional` **transactionManager?**: [`CapTransactionManagerPort`](../../../cap-nest/src/interfaces/CapTransactionManagerPort.md)\<`unknown`\>

Defined in: [cap-express/src/create-cap-express.ts:36](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-express/src/create-cap-express.ts#L36)
