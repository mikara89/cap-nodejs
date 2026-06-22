[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-transport-nestjs-microservices/src](../README.md) / CapMicroservicesPublisher

# Class: CapMicroservicesPublisher

Defined in: cap-transport-nestjs-microservices/src/cap-microservices-publisher.ts:17

## Implements

- [`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md)

## Constructors

### Constructor

> **new CapMicroservicesPublisher**(`client`, `config`): `CapMicroservicesPublisher`

Defined in: cap-transport-nestjs-microservices/src/cap-microservices-publisher.ts:18

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

Defined in: cap-transport-nestjs-microservices/src/cap-microservices-publisher.ts:25

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers?

[`CapHeaders`](../../../cap-nest/src/type-aliases/CapHeaders.md)

##### metadata?

[`PublishMetadata`](../../../cap-nest/src/interfaces/PublishMetadata.md)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PublisherPort`](../../../cap-nest/src/interfaces/PublisherPort.md).[`emit`](../../../cap-nest/src/interfaces/PublisherPort.md#emit)
