[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / SubscriberPort

# Interface: SubscriberPort

Defined in: cap-core/dist/ports/subscriber.port.d.ts:9

## Methods

### close()?

> `optional` **close**(): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/subscriber.port.d.ts:12

#### Returns

`Promise`\<`void`\>

***

### consume()

> **consume**(`topic`, `group`, `handler`): `Promise`\<`void`\>

Defined in: cap-core/dist/ports/subscriber.port.d.ts:10

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

Defined in: cap-core/dist/ports/subscriber.port.d.ts:11

#### Parameters

##### options?

`InitOptions`

#### Returns

`Promise`\<`void`\>
