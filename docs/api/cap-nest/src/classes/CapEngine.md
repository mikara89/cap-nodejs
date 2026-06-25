[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-nest/src](../README.md) / CapEngine

# Class: CapEngine

Defined in: cap-core/dist/engine/cap-engine.d.ts:35

## Constructors

### Constructor

> **new CapEngine**(`options`): `CapEngine`

Defined in: cap-core/dist/engine/cap-engine.d.ts:47

#### Parameters

##### options

[`CapEngineOptions`](../interfaces/CapEngineOptions.md)

#### Returns

`CapEngine`

## Methods

### close()

> **close**(): `Promise`\<`void`\>

Defined in: cap-core/dist/engine/cap-engine.d.ts:54

#### Returns

`Promise`\<`void`\>

***

### dispatchOutboxBatch()

> **dispatchOutboxBatch**(): `Promise`\<`number`\>

Defined in: cap-core/dist/engine/cap-engine.d.ts:52

#### Returns

`Promise`\<`number`\>

***

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: cap-core/dist/engine/cap-engine.d.ts:48

#### Type Parameters

##### T

`T` = [`JsonValue`](../type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### options?

[`CapPublishOptions`](../interfaces/CapPublishOptions.md)\<`unknown`\>

#### Returns

`Promise`\<`void`\>

***

### retryInboxBatch()

> **retryInboxBatch**(): `Promise`\<`number`\>

Defined in: cap-core/dist/engine/cap-engine.d.ts:53

#### Returns

`Promise`\<`number`\>

***

### retryReceived()

> **retryReceived**(`rec`): `Promise`\<`void`\>

Defined in: cap-core/dist/engine/cap-engine.d.ts:51

#### Parameters

##### rec

[`CapReceivedEvent`](../interfaces/CapReceivedEvent.md)

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `void`

Defined in: cap-core/dist/engine/cap-engine.d.ts:50

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

Defined in: cap-core/dist/engine/cap-engine.d.ts:49

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`ctx`) => `Promise`\<`T`\>

##### options?

[`CapTransactionOptions`](../interfaces/CapTransactionOptions.md)

#### Returns

`Promise`\<`T`\>
