[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapEngine

# Class: CapEngine

Defined in: [cap-core/src/engine/cap-engine.ts:80](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L80)

## Constructors

### Constructor

> **new CapEngine**(`options`): `CapEngine`

Defined in: [cap-core/src/engine/cap-engine.ts:93](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L93)

#### Parameters

##### options

[`CapEngineOptions`](../interfaces/CapEngineOptions.md)

#### Returns

`CapEngine`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: [cap-core/src/engine/cap-engine.ts:242](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L242)

#### Returns

`Promise`\<`void`\>

***

### dispatchOutboxBatch()

> **dispatchOutboxBatch**(): `Promise`\<`number`\>

Defined in: [cap-core/src/engine/cap-engine.ts:200](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L200)

#### Returns

`Promise`\<`number`\>

***

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: [cap-core/src/engine/cap-engine.ts:106](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L106)

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

Defined in: [cap-core/src/engine/cap-engine.ts:224](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L224)

#### Returns

`Promise`\<`number`\>

***

### retryReceived()

> **retryReceived**(`rec`): `Promise`\<`void`\>

Defined in: [cap-core/src/engine/cap-engine.ts:189](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L189)

#### Parameters

##### rec

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `void`

Defined in: [cap-core/src/engine/cap-engine.ts:153](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L153)

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

Defined in: [cap-core/src/engine/cap-engine.ts:142](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/engine/cap-engine.ts#L142)

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
