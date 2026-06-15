[**CAP for NestJS API**](../../../README.md)

---

[CAP for NestJS API](../../../README.md) / [storage-mikro-orm/src](../README.md) / MikroReceivedStorage

# Class: MikroReceivedStorage

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:11](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L11)

MikroORM implementation of IReceivedStorage.
Persists inbox events, deduplicates by group/dedupeKey, and manages retry/dead-letter state.

## Implements

- `IReceivedStorage`

## Constructors

### Constructor

> **new MikroReceivedStorage**(`em`, `orm?`): `MikroReceivedStorage`

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:13](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L13)

#### Parameters

##### em

`EntityManager`

##### orm?

`MikroORM`\<`IDatabaseDriver`\<`Connection`\>, `EntityManager`\<`IDatabaseDriver`\<`Connection`\>\>\>

#### Returns

`MikroReceivedStorage`

## Methods

### findReceivedById()

> **findReceivedById**(`id`): `Promise`\<`CapReceivedEvent`\<`unknown`\> \| `undefined`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:126](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L126)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`CapReceivedEvent`\<`unknown`\> \| `undefined`\>

#### Implementation of

`IReceivedStorage.findReceivedById`

---

### getRetryDue()

> **getRetryDue**(`limit`): `Promise`\<`CapReceivedEvent`\<`unknown`\>[]\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:109](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L109)

#### Parameters

##### limit

`number`

#### Returns

`Promise`\<`CapReceivedEvent`\<`unknown`\>[]\>

#### Implementation of

`IReceivedStorage.getRetryDue`

---

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:18](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L18)

#### Parameters

##### options?

###### autoInit?

`boolean`

###### createSchema?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IReceivedStorage.initialize`

---

### listReceived()

> **listReceived**(`opts`): `Promise`\<\{ `items`: `CapReceivedEvent`\<`unknown`\>[]; `total`: `number`; \}\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:133](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L133)

#### Parameters

##### opts

###### due?

`boolean`

###### limit?

`number`

###### offset?

`number`

###### topic?

`string`

#### Returns

`Promise`\<\{ `items`: `CapReceivedEvent`\<`unknown`\>[]; `total`: `number`; \}\>

#### Implementation of

`IReceivedStorage.listReceived`

---

### markProcessed()

> **markProcessed**(`id`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:88](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L88)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IReceivedStorage.markProcessed`

---

### trySaveReceived()

> **trySaveReceived**(`event`): `Promise`\<`TrySaveReceivedResult`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:70](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L70)

#### Parameters

##### event

`CapReceivedEvent`\<`unknown`\>

#### Returns

`Promise`\<`TrySaveReceivedResult`\>

#### Implementation of

`IReceivedStorage.trySaveReceived`

---

### markReceivedFailed()

> **markReceivedFailed**(`id`, `error`, `options`): `Promise`\<`void`\>

Defined in: [storage-mikro-orm/src/storage/mikro-received-storage.ts:96](https://github.com/mikara89/cap-nestjs/blob/main/libs/storage-mikro-orm/src/storage/mikro-received-storage.ts#L96)

#### Parameters

##### id

`string`

##### error

`unknown`

##### options

`MarkReceivedFailedOptions`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IReceivedStorage.markReceivedFailed`
