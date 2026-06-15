[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [transport-nestjs-microservices/src](../README.md) / CapMicroservicesPublisher

# Class: CapMicroservicesPublisher

Defined in: [transport-nestjs-microservices/src/cap-microservices-publisher.ts:17](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-publisher.ts#L17)

## Implements

- `IPublisher`

## Constructors

### Constructor

> **new CapMicroservicesPublisher**(`client`, `config`): `CapMicroservicesPublisher`

Defined in: [transport-nestjs-microservices/src/cap-microservices-publisher.ts:18](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-publisher.ts#L18)

#### Parameters

##### client

[`CapClientProxyLike`](../interfaces/CapClientProxyLike.md)

##### config

[`NestjsMicroservicesTransportConfig`](../interfaces/NestjsMicroservicesTransportConfig.md)

#### Returns

`CapMicroservicesPublisher`

## Methods

### emit()

> **emit**(`topic`, `payload`, `headers?`, `metadata?`): `Promise`\<`void`\>

Defined in: [transport-nestjs-microservices/src/cap-microservices-publisher.ts:25](https://github.com/mikara89/cap-nestjs/blob/main/libs/transport-nestjs-microservices/src/cap-microservices-publisher.ts#L25)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

`CapHeaders`

##### metadata?

`CapPublishMetadata`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IPublisher.emit`
