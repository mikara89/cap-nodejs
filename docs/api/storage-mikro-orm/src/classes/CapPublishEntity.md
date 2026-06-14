[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [storage-mikro-orm/src](../README.md) / CapPublishEntity

# Class: CapPublishEntity

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:11](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L11)

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

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:31](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L31)

***

### headers?

> `optional` **headers?**: `CapHeaders`

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:22](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L22)

***

### id

> **id**: `string`

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:13](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L13)

***

### payload

> **payload**: `Record`\<`string`, `unknown`\>

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:19](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L19)

***

### retryCount

> **retryCount**: `number` = `0`

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:28](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L28)

***

### status?

> `optional` **status?**: `"published"` \| `"failed"`

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:25](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L25)

***

### topic

> **topic**: `string`

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:16](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L16)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [storage-mikro-orm/src/entities/cap-publish.entity.ts:34](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/entities/cap-publish.entity.ts#L34)
