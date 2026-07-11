[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-storage-mikro-orm/src](../README.md) / CapReceivedEntity

# Class: CapReceivedEntity

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:17

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

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:58

***

### dedupeKey

> **dedupeKey**: `string`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:31

***

### group

> **group**: `string`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:25

***

### headers?

> `optional` **headers?**: [`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:37

***

### id

> **id**: `string`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:19

***

### lastError?

> `optional` **lastError?**: `string` \| `null`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:49

***

### messageId

> **messageId**: `string`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:28

***

### nextRetry?

> `optional` **nextRetry?**: `Date`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:52

***

### payload

> **payload**: [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:34

***

### processed

> **processed**: `boolean` = `false`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:40

***

### processedAt?

> `optional` **processedAt?**: `Date` \| `null`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:55

***

### retryCount

> **retryCount**: `number` = `0`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:43

***

### status

> **status**: [`CapReceivedStatus`](../../../cap-nest/src/type-aliases/CapReceivedStatus.md) = `'pending'`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:46

***

### topic

> **topic**: `string`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:22

***

### updatedAt

> **updatedAt**: `Date`

Defined in: cap-storage-mikro-orm/src/entities/cap-received.entity.ts:61
