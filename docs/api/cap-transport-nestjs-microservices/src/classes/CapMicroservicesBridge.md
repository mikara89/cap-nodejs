[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-transport-nestjs-microservices/src](../README.md) / CapMicroservicesBridge

# Class: CapMicroservicesBridge

Defined in: cap-transport-nestjs-microservices/src/cap-microservices-bridge.ts:15

## Implements

- [`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md)

## Constructors

### Constructor

> **new CapMicroservicesBridge**(): `CapMicroservicesBridge`

#### Returns

`CapMicroservicesBridge`

## Methods

### consume()

> **consume**(`topic`, `group`, `onMessage`): `Promise`\<`void`\>

Defined in: cap-transport-nestjs-microservices/src/cap-microservices-bridge.ts:18

#### Parameters

##### topic

`string`

##### group

`string`

##### onMessage

`MessageHandler`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SubscriberPort`](../../../cap-nest/src/interfaces/SubscriberPort.md).[`consume`](../../../cap-nest/src/interfaces/SubscriberPort.md#consume)

***

### dispatch()

> **dispatch**(`topic`, `group`, `message`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: cap-transport-nestjs-microservices/src/cap-microservices-bridge.ts:32

#### Parameters

##### topic

`string`

##### group

`string`

##### message

`unknown`

##### headers?

[`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

##### metadata?

[`SubscribeMetadata`](../../../cap-nest/src/interfaces/SubscribeMetadata.md)

#### Returns

`Promise`\<`void`\>
