[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-core/src](../README.md) / SubscriberPort

# Interface: SubscriberPort

Defined in: cap-core/src/ports/subscriber.port.ts:17

## Methods

### close()?

> `optional` **close**(): `Promise`\<`void`\>

Defined in: cap-core/src/ports/subscriber.port.ts:21

#### Returns

`Promise`\<`void`\>

***

### consume()

> **consume**(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: cap-core/src/ports/subscriber.port.ts:18

#### Parameters

##### topic

`string`

##### group

`string`

##### handler

[`CapHandler`](../type-aliases/CapHandler.md)

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`options?`): `Promise`\<`void`\>

Defined in: cap-core/src/ports/subscriber.port.ts:20

#### Parameters

##### options?

[`InitOptions`](InitOptions.md)

#### Returns

`Promise`\<`void`\>
