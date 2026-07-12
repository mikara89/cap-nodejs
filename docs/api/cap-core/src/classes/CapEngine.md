[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapEngine

# Class: CapEngine

Defined in: [cap-core/src/engine/cap-engine.ts:81](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L81)

## Constructors

### Constructor

> **new CapEngine**(`options`): `CapEngine`

Defined in: [cap-core/src/engine/cap-engine.ts:94](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L94)

#### Parameters

##### options

[`CapEngineOptions`](../interfaces/CapEngineOptions.md)

#### Returns

`CapEngine`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [cap-core/src/engine/cap-engine.ts:250](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L250)

#### Returns

`Promise`\<`void`\>

***

### dispatchOutboxBatch()

> **dispatchOutboxBatch**(): `Promise`\<`number`\>

Defined in: [cap-core/src/engine/cap-engine.ts:201](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L201)

#### Returns

`Promise`\<`number`\>

***

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: [cap-core/src/engine/cap-engine.ts:107](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L107)

#### Type Parameters

##### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### options?

[`CapPublishOptions`](../interfaces/CapPublishOptions.md) = `{}`

#### Returns

`Promise`\<`void`\>

***

### retryInboxBatch()

> **retryInboxBatch**(): `Promise`\<`number`\>

Defined in: [cap-core/src/engine/cap-engine.ts:232](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L232)

#### Returns

`Promise`\<`number`\>

***

### retryReceived()

> **retryReceived**(`rec`): `Promise`\<`void`\>

Defined in: [cap-core/src/engine/cap-engine.ts:190](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L190)

#### Parameters

##### rec

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `void`

Defined in: [cap-core/src/engine/cap-engine.ts:154](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L154)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

`Handler`\<`T`\>

#### Returns

`void`

***

### transaction()

> **transaction**\<`T`\>(`fn`, `options?`): `Promise`\<`T`\>

Defined in: [cap-core/src/engine/cap-engine.ts:143](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L143)

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`ctx`) => `Promise`\<`T`\>

##### options?

[`CapTransactionOptions`](../interfaces/CapTransactionOptions.md) = `{}`

#### Returns

`Promise`\<`T`\>
