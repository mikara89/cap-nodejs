[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-nestjs-microservices/src](../README.md) / CapMicroservicesBridge

# Class: CapMicroservicesBridge

Defined in: [transport-nestjs-microservices/src/cap-microservices-bridge.ts:7](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-bridge.ts#L7)

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

Defined in: [transport-nestjs-microservices/src/cap-microservices-bridge.ts:10](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-bridge.ts#L10)

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

> **dispatch**(`topic`, `group`, `message`, `headers?`): `Promise`\<`void`\>

Defined in: [transport-nestjs-microservices/src/cap-microservices-bridge.ts:24](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-bridge.ts#L24)

#### Parameters

##### topic

`string`

##### group

`string`

##### message

`unknown`

##### headers?

`CapHeaders`

#### Returns

`Promise`\<`void`\>
