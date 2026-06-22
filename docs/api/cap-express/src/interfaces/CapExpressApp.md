[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-express/src](../README.md) / CapExpressApp

# Interface: CapExpressApp

Defined in: cap-express/src/create-cap-express.ts:36

## Properties

### engine

> **engine**: [`CapEngine`](../../../cap-nest/src/classes/CapEngine.md)

Defined in: cap-express/src/create-cap-express.ts:37

***

### schedulerRunning

> `readonly` **schedulerRunning**: `boolean`

Defined in: cap-express/src/create-cap-express.ts:51

## Methods

### healthRouter()

> **healthRouter**(): `Router`

Defined in: cap-express/src/create-cap-express.ts:50

#### Returns

`Router`

***

### publish()

> **publish**\<`T`\>(`topic`, `payload`, `options?`): `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:38

#### Type Parameters

##### T

`T` *extends* [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md) = [`JsonValue`](../../../cap-nest/src/type-aliases/JsonValue.md)

#### Parameters

##### topic

`string`

##### payload

`T`

##### options?

[`CapPublishOptions`](../../../cap-nest/src/interfaces/CapPublishOptions.md)

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(): `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:48

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:49

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**\<`T`\>(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: cap-express/src/create-cap-express.ts:43

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
