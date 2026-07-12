[**CAP Node.js API**](../../../README.md)

***

[CAP Node.js API](../../../README.md) / [cap-core/src](../README.md) / CapHandler

# Type Alias: CapHandler\<T\>

> **CapHandler**\<`T`\> = (`payload`, `headers?`, `metadata?`) => `Promise`\<`void`\> \| `void`

Defined in: [cap-core/src/ports/subscriber.port.ts:11](https://github.com/mikara89/cap-nodejs/blob/main/libs/cap-core/src/ports/subscriber.port.ts#L11)

## Type Parameters

### T

`T` = `unknown`

## Parameters

### payload

`T`

### headers?

[`CapHeaders`](CapHeaders.md)

### metadata?

[`SubscribeMetadata`](../interfaces/SubscribeMetadata.md)

## Returns

`Promise`\<`void`\> \| `void`
