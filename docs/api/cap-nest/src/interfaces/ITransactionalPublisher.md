[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-nest/src](../README.md) / ITransactionalPublisher

# Interface: ITransactionalPublisher

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:29](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L29)

Optional transactional publisher interface. Adapters that can coordinate
with a database transaction may implement this to defer or participate
in sending messages in the same transactional context.

## Methods

### emitWithTx()

> **emitWithTx**(`topic`, `payload`, `headers`, `tx`): `Promise`\<`void`\>

Defined in: [cap-nest/src/cap/abstractions/transport.interface.ts:30](https://github.com/mikara89/cap-nestjs/blob/main/libs/cap-nest/src/cap/abstractions/transport.interface.ts#L30)

#### Parameters

##### topic

`string`

##### payload

`unknown`

##### headers

[`CapHeaders`](../type-aliases/CapHeaders.md) \| `undefined`

##### tx

`unknown`

#### Returns

`Promise`\<`void`\>
