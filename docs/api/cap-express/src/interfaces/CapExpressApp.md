[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-express/src](../README.md) / CapExpressApp

# Interface: CapExpressApp

Defined in: cap-express/src/create-cap-express.ts:42

## Properties

### engine

> **engine**: [`CapEngine`](../../../cap-nest/src/classes/CapEngine.md)

Defined in: cap-express/src/create-cap-express.ts:43

***

### ready

> `readonly` **ready**: `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:44

***

### schedulerRunning

> `readonly` **schedulerRunning**: `boolean`

Defined in: cap-express/src/create-cap-express.ts:62

## Methods

### healthRouter()

> **healthRouter**(): `Router`

Defined in: cap-express/src/create-cap-express.ts:61

#### Returns

`Router`

***

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:45

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### options?

[`CapPublishOptions`](../../../cap-nest/src/interfaces/CapPublishOptions.md)\<`unknown`\>

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(): `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:59

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:60

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:50

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

(`payload`, `headers?`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### transaction()

> **transaction**\<`T`\>(`fn`, `options?`): `Promise`\<`T`\>

Defined in: cap-express/src/create-cap-express.ts:55

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

(`ctx`) => `Promise`\<`T`\>

##### options?

[`CapTransactionOptions`](../../../cap-nest/src/interfaces/CapTransactionOptions.md)

#### Returns

`Promise`\<`T`\>
