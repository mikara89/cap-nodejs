[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-mikro-orm/src](../README.md) / CapPublishEntity

# Class: CapPublishEntity

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:15

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

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:50

***

### headers?

> `optional` **headers?**: [`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:26

***

### id

> **id**: `string`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:17

***

### lastError?

> `optional` **lastError?**: `string` \| `null`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:38

***

### lockedBy?

> `optional` **lockedBy?**: `string` \| `null`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:41

***

### lockedUntil?

> `optional` **lockedUntil?**: `Date` \| `null`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:44

***

### nextRetryAt?

> `optional` **nextRetryAt?**: `Date` \| `null`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:35

***

### payload

> **payload**: [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:23

***

### publishedAt?

> `optional` **publishedAt?**: `Date` \| `null`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:47

***

### retryCount

> **retryCount**: `number` = `0`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:32

***

### status

> **status**: [`CapPublishStatus`](../../../cap-nest/src/type-aliases/CapPublishStatus.md) = `'pending'`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:29

***

### topic

> **topic**: `string`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:20

***

### updatedAt

> **updatedAt**: `Date`

Defined in: cap-storage-mikro-orm/src/entities/cap-publish.entity.ts:53
