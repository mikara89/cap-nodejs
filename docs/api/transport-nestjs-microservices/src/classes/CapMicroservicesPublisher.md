[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-nestjs-microservices/src](../README.md) / CapMicroservicesPublisher

# Class: CapMicroservicesPublisher

Defined in: [transport-nestjs-microservices/src/cap-microservices-publisher.ts:13](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-publisher.ts#L13)

## Implements

- `IPublisher`

## Constructors

### Constructor

> **new CapMicroservicesPublisher**(`client`, `config`): `CapMicroservicesPublisher`

Defined in: [transport-nestjs-microservices/src/cap-microservices-publisher.ts:14](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-publisher.ts#L14)

#### Parameters

##### client

[`CapClientProxyLike`](../interfaces/CapClientProxyLike.md)

##### config

[`NestjsMicroservicesTransportConfig`](../interfaces/NestjsMicroservicesTransportConfig.md)

#### Returns

`CapMicroservicesPublisher`

## Methods

### emit()

> **emit**(`topic`, `payload`, `headers?`): `Promise`\<`void`\>

Defined in: [transport-nestjs-microservices/src/cap-microservices-publisher.ts:21](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-publisher.ts#L21)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

`CapHeaders`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublisher.emit`
