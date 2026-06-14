[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [storage-mikro-orm/src](../README.md) / CapReceivedEntity

# Class: CapReceivedEntity

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:12](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L12)

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

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:38](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L38)

***

### group

> **group**: `string`

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:20](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L20)

***

### headers?

> `optional` **headers?**: `CapHeaders`

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:26](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L26)

***

### id

> **id**: `string`

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:14](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L14)

***

### nextRetry?

> `optional` **nextRetry?**: `Date`

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:35](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L35)

***

### payload

> **payload**: `Record`\<`string`, `unknown`\>

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:23](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L23)

***

### processed

> **processed**: `boolean` = `false`

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:29](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L29)

***

### retryCount

> **retryCount**: `number` = `0`

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:32](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L32)

***

### topic

> **topic**: `string`

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:17](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L17)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [storage-mikro-orm/src/entities/cap-received.entity.ts:41](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-received.entity.ts#L41)
