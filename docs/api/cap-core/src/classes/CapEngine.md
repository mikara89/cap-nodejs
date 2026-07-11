[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapEngine

# Class: CapEngine

Defined in: cap-core/src/engine/cap-engine.ts:80

## Constructors

### Constructor

> **new CapEngine**(`options`): `CapEngine`

Defined in: cap-core/src/engine/cap-engine.ts:93

#### Parameters

##### options

[`CapEngineOptions`](../interfaces/CapEngineOptions.md)

#### Returns

`CapEngine`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: cap-core/src/engine/cap-engine.ts:242

#### Returns

`Promise`\<`void`\>

***

### dispatchOutboxBatch()

> **dispatchOutboxBatch**(): `Promise`\<`number`\>

Defined in: cap-core/src/engine/cap-engine.ts:200

#### Returns

`Promise`\<`number`\>

***

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: cap-core/src/engine/cap-engine.ts:106

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

Defined in: cap-core/src/engine/cap-engine.ts:224

#### Returns

`Promise`\<`number`\>

***

### retryReceived()

> **retryReceived**(`rec`): `Promise`\<`void`\>

Defined in: cap-core/src/engine/cap-engine.ts:189

#### Parameters

##### rec

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `void`

Defined in: cap-core/src/engine/cap-engine.ts:153

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

Defined in: cap-core/src/engine/cap-engine.ts:142

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
