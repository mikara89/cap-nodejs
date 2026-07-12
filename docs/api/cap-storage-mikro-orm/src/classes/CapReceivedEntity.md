[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-mikro-orm/src](../README.md) / CapReceivedEntity

# Class: CapReceivedEntity

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:17](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L17)

MikroORM entity for CAP inbox (received events).
Stores incoming messages for processing and retry logic.

## Constructors

### Constructor

> **new CapReceivedEntity**(): `CapReceivedEntity`

#### Returns

`CapReceivedEntity`

## Properties

### createdAt

> **createdAt**: `Date`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:58](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L58)

***

### dedupeKey

> **dedupeKey**: `string`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:31](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L31)

***

### group

> **group**: `string`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:25](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L25)

***

### headers?

> `optional` **headers?**: [`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:37](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L37)

***

### id

> **id**: `string`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:19](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L19)

***

### lastError?

> `optional` **lastError?**: `string` \| `null`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:49](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L49)

***

### messageId

> **messageId**: `string`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:28](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L28)

***

### nextRetry?

> `optional` **nextRetry?**: `Date`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:52](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L52)

***

### payload

> **payload**: [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:34](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L34)

***

### processed

> **processed**: `boolean` = `false`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:40](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L40)

***

### processedAt?

> `optional` **processedAt?**: `Date` \| `null`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:55](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L55)

***

### retryCount

> **retryCount**: `number` = `0`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:43](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L43)

***

### status

> **status**: [`CapReceivedStatus`](../../../cap-nest/src/type-aliases/CapReceivedStatus.md) = `'pending'`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:46](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L46)

***

### topic

> **topic**: `string`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:22](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L22)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [cap-storage-mikro-orm/src/entities/cap-received.entity.ts:61](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-received.entity.ts#L61)
