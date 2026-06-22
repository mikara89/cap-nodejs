[**CAP for NestJS API**](../../../README.md)

***

[CAP for NestJS API](../../../README.md) / [cap-core/src](../README.md) / CapSubscribeOptions

# Interface: CapSubscribeOptions\<T\>

Defined in: cap-core/src/models/cap-options.ts:9

## Type Parameters

### T

`T` = `unknown`

## Properties

### dto?

> `optional` **dto?**: () => `T`

Defined in: cap-core/src/models/cap-options.ts:12

#### Returns

`T`

***

### filter?

> `optional` **filter?**: (`payload`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: cap-core/src/models/cap-options.ts:13

#### Parameters

##### payload

`T`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### group?

> `optional` **group?**: `string`

Defined in: cap-core/src/models/cap-options.ts:11

***

### topic

> **topic**: `string`

Defined in: cap-core/src/models/cap-options.ts:10
