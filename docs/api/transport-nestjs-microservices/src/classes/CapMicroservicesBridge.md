[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-nestjs-microservices/src](../README.md) / CapMicroservicesBridge

# Class: CapMicroservicesBridge

Defined in: [transport-nestjs-microservices/src/cap-microservices-bridge.ts:15](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-bridge.ts#L15)

## Implements

- `ISubscriber`

## Constructors

### Constructor

> **new CapMicroservicesBridge**(): `CapMicroservicesBridge`

#### Returns

`CapMicroservicesBridge`

## Methods

### consume()

> **consume**(`topic`, `group`, `onMessage`): `Promise`\<`void`\>

Defined in: [transport-nestjs-microservices/src/cap-microservices-bridge.ts:18](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-bridge.ts#L18)

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

`ISubscriber.consume`

***

### dispatch()

> **dispatch**(`topic`, `group`, `message`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [transport-nestjs-microservices/src/cap-microservices-bridge.ts:32](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-bridge.ts#L32)

#### Parameters

##### topic

`string`

##### group

`string`

##### message

`unknown`

##### headers?

`CapHeaders`

##### metadata?

`CapDeliveryMetadata`

#### Returns

`Promise`\<`void`\>
