[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-mikro-orm/src](../README.md) / CapPublishEntity

# Class: CapPublishEntity

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:15](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L15)

MikroORM entity for CAP outbox (publish events).
Stores messages pending publication or failed publish attempts.

## Constructors

### Constructor

> **new CapPublishEntity**(): `CapPublishEntity`

#### Returns

`CapPublishEntity`

## Properties

### createdAt

> **createdAt**: `Date`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:50](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L50)

***

### headers?

> `optional` **headers?**: [`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:26](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L26)

***

### id

> **id**: `string`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:17](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L17)

***

### lastError?

> `optional` **lastError?**: `string` \| `null`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:38](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L38)

***

### lockedBy?

> `optional` **lockedBy?**: `string` \| `null`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:41](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L41)

***

### lockedUntil?

> `optional` **lockedUntil?**: `Date` \| `null`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:44](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L44)

***

### nextRetryAt?

> `optional` **nextRetryAt?**: `Date` \| `null`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:35](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L35)

***

### payload

> **payload**: [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:23](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L23)

***

### publishedAt?

> `optional` **publishedAt?**: `Date` \| `null`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:47](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L47)

***

### retryCount

> **retryCount**: `number` = `0`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:32](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L32)

***

### status

> **status**: [`CapPublishStatus`](../../../cap-nest/src/type-aliases/CapPublishStatus.md) = `'pending'`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:29](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L29)

***

### topic

> **topic**: `string`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:20](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L20)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:53](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-storage-mikro-orm/src/entities/cap-publish.entity.ts#L53)
